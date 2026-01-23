import { AdtHTTP } from "../AdtHTTP"
import { fullParse, xmlNode, xmlArray, xmlNodeAttr } from "../utilities"

//**********************************************************************
// TYPES
//**********************************************************************/

export interface Package {
  name: string;
  description: string;
  packageType: 'development' | 'production' | 'test';
  softwareComponent: string;
  transportLayer: string;
  applicationComponent?: string;
  translationRelevance?: string;
  responsible?: string;
}

export interface PackageValidationOptions {
  /** Package name */
  objname: string;
  /** Package description */
  description: string;
  /** Package type */
  packagetype: 'development' | 'production' | 'test';
  /** Software component */
  swcomp: string;
  /** Application component (optional) */
  appcomp?: string;
  /** Check mode: 'basic' or 'full' */
  checkmode: 'basic' | 'full';
}

export interface PackageValidationResult {
  success: boolean;
  messages: StatusMessage[];
}

export interface StatusMessage {
  severity: 'success' | 'info' | 'warning' | 'error';
  text: string;
  code?: string;
}

export interface NamedItem {
  name: string;
  description: string;
}

export interface PackageReadOptions {
  /** Use ETag for caching */
  ifNoneMatch?: string;
}

export interface PackageCreateOptions {
  /** Transport request number */
  corrNr: string;
}

//**********************************************************************
// PARSERS
//**********************************************************************/

/**
 * Parse package information from XML
 */
function parsePackage(body: string): Package {
  const raw = fullParse(body, { removeNSPrefix: true });
  const pkg = raw?.package || raw;

  return {
    name: xmlNode(pkg, 'name'),
    description: xmlNode(pkg, 'description'),
    packageType: xmlNode(pkg, 'packageType') || 'development',
    softwareComponent: xmlNode(pkg, 'softwareComponent'),
    transportLayer: xmlNode(pkg, 'transportLayer'),
    applicationComponent: xmlNode(pkg, 'applicationComponent'),
    translationRelevance: xmlNode(pkg, 'translationRelevance'),
    responsible: xmlNode(pkg, 'responsible')
  };
}

/**
 * Parse validation result from XML
 */
function parseValidationResult(body: string): PackageValidationResult {
  const raw = fullParse(body, { removeNSPrefix: true });
  const messages = xmlArray(raw, 'message').map((msg: any) => ({
    severity: msg['severity'] || 'info',
    text: xmlNode(msg, 'text'),
    code: msg['code']
  }));

  // Check if all messages are success/info
  const success = messages.every(m =>
    m.severity === 'success' || m.severity === 'info'
  );

  return { success, messages };
}

/**
 * Parse named items (value help) from XML
 */
function parseNamedItems(body: string): NamedItem[] {
  const raw = fullParse(body, { removeNSPrefix: true });

  return xmlArray(raw, 'item').map((item: any) => ({
    name: xmlNode(item, 'name'),
    description: xmlNode(item, 'description')
  }));
}

//**********************************************************************
// API FUNCTIONS
//**********************************************************************/

/**
 * Read package information
 * @param h ADT HTTP client
 * @param packageName Package name
 * @param options Optional read options
 * @returns Package information
 */
export async function getPackage(
  h: AdtHTTP,
  packageName: string,
  options?: PackageReadOptions
): Promise<Package & { etag?: string }> {
  const headers: any = {
    "Accept": "application/vnd.sap.adt.packages.v2+xml, application/vnd.sap.adt.packages.v1+xml",
    "X-sap-adt-profiling": "server-time"
  };

  if (options?.ifNoneMatch) {
    headers["If-None-Match"] = options.ifNoneMatch;
  }

  const response = await h.request(`/sap/bc/adt/packages/${encodeURIComponent(packageName)}`, {
    method: "GET",
    headers
  });

  const pkg = parsePackage(response.body);

  // Extract ETag from response headers if available
  const etag = (response.headers?.etag || response.headers?.['ETag']) as string | undefined;

  return { ...pkg, etag };
}

/**
 * Create a new package
 * @param h ADT HTTP client
 * @param pkg Package data
 * @param options Create options
 * @returns Created package location
 */
export async function createPackage(
  h: AdtHTTP,
  pkg: Package,
  options?: PackageCreateOptions
): Promise<{ location: string; package: Package }> {
  const headers: any = {
    "Content-Type": "application/vnd.sap.adt.packages.v1+xml",
    "Accept": "application/vnd.sap.adt.packages.v2+xml, application/vnd.sap.adt.packages.v1+xml",
    "X-sap-adt-profiling": "server-time"
  };

  // Escape XML special characters
  const escapeXml = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Determine if this is a $TMP package (local object)
  const isTmp = !pkg.transportLayer || pkg.transportLayer === '';

  // Build XML body with proper ADT structure (attributes, not child elements)
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<pak:package xmlns:pak="http://www.sap.com/adt/packages" xmlns:adtcore="http://www.sap.com/adt/core"
  adtcore:description="${escapeXml(pkg.description)}"
  adtcore:name="${pkg.name}"
  adtcore:type="DEVC/K"
  adtcore:version="active"
  adtcore:responsible="${pkg.responsible || h.username}">
  <adtcore:packageRef adtcore:name="$TMP"/>
  <pak:attributes pak:packageType="${pkg.packageType}"/>
  <pak:superPackage adtcore:name="$TMP"/>
  <pak:applicationComponent ${pkg.applicationComponent ? `adtcore:name="${pkg.applicationComponent}"` : ''}/>
  <pak:transport>
    <pak:softwareComponent adtcore:name="${pkg.softwareComponent}"/>
    <pak:transportLayer pak:name="${isTmp ? '$TMP' : escapeXml(pkg.transportLayer)}"/>
  </pak:transport>
  <pak:translation/>
  <pak:useAccesses/>
  <pak:packageInterfaces/>
  <pak:subPackages/>
</pak:package>`;

  const qs: any = {};
  if (options?.corrNr && !isTmp) {
    qs["corrNr"] = options.corrNr;
  }

  const response = await h.request('/sap/bc/adt/packages', {
    method: "POST",
    qs,
    headers,
    body
  });

  const location = (response.headers?.location || response.headers?.['Location']) as string | undefined;

  if (!location) {
    throw new Error('Creation failed: No Location header returned');
  }

  // Read the created package
  const createdPkg = await getPackage(h, pkg.name);

  return { location, package: createdPkg };
}

/**
 * Validate package configuration
 * @param h ADT HTTP client
 * @param options Validation options
 * @returns Validation result
 */
export async function validatePackage(
  h: AdtHTTP,
  options: PackageValidationOptions
): Promise<PackageValidationResult> {
  const headers = {
    "Accept": "application/vnd.sap.as+xml",
    "X-sap-adt-profiling": "server-time"
  };

  const qs: any = {
    objname: options.objname,
    description: options.description,
    packagetype: options.packagetype,
    checkmode: options.checkmode
  };

  if (options.swcomp) {
    qs["swcomp"] = options.swcomp;
  }

  if (options.appcomp) {
    qs["appcomp"] = options.appcomp;
  }

  const response = await h.request('/sap/bc/adt/packages/validation', {
    method: "POST",
    qs,
    headers
  });

  return parseValidationResult(response.body);
}

/**
 * Get transport layers (value help)
 * @param h ADT HTTP client
 * @param name Search pattern (supports wildcards, default: *)
 * @returns List of transport layers
 */
export async function getTransportLayers(
  h: AdtHTTP,
  name: string = '*'
): Promise<NamedItem[]> {
  const headers = {
    "Accept": "application/xml, application/vnd.sap.adt.nameditems.v1+xml",
    "X-sap-adt-profiling": "server-time"
  };

  const response = await h.request('/sap/bc/adt/packages/valuehelps/transportlayers', {
    method: "GET",
    qs: { name },
    headers
  });

  return parseNamedItems(response.body);
}

/**
 * Get software components (value help)
 * @param h ADT HTTP client
 * @param name Search pattern (supports wildcards, default: *)
 * @returns List of software components
 */
export async function getSoftwareComponents(
  h: AdtHTTP,
  name: string = '*'
): Promise<NamedItem[]> {
  const headers = {
    "Accept": "application/xml, application/vnd.sap.adt.nameditems.v1+xml",
    "X-sap-adt-profiling": "server-time"
  };

  const response = await h.request('/sap/bc/adt/packages/valuehelps/softwarecomponents', {
    method: "GET",
    qs: { name },
    headers
  });

  return parseNamedItems(response.body);
}

/**
 * Get translation relevances (value help)
 * @param h ADT HTTP client
 * @param maxItemCount Maximum number of items (default: 50)
 * @returns List of translation relevances
 */
export async function getTranslationRelevances(
  h: AdtHTTP,
  maxItemCount: number = 50
): Promise<NamedItem[]> {
  const headers = {
    "Accept": "application/xml, application/vnd.sap.adt.nameditems.v1+xml",
    "X-sap-adt-profiling": "server-time"
  };

  const response = await h.request('/sap/bc/adt/packages/valuehelps/translationrelevances', {
    method: "GET",
    qs: { maxItemCount },
    headers
  });

  return parseNamedItems(response.body);
}

/**
 * Get package object properties
 * @param h ADT HTTP client
 * @param packageUri Package URI
 * @returns Object properties
 */
export async function getPackageProperties(
  h: AdtHTTP,
  packageUri: string
): Promise<Record<string, any>> {
  const headers = {
    "Accept": "application/vnd.sap.adt.repository.objproperties.result.v1+xml",
    "X-sap-adt-profiling": "server-time"
  };

  const response = await h.request('/sap/bc/adt/repository/informationsystem/objectproperties/values', {
    method: "GET",
    qs: { uri: packageUri },
    headers
  });

  const raw = fullParse(response.body, { removeNSPrefix: true });
  const properties = xmlArray(raw, 'property');

  const result: Record<string, any> = {};
  properties.forEach((prop: any) => {
    const name = xmlNode(prop, 'name');
    const value = xmlNode(prop, 'value');
    result[name] = value;
  });

  return result;
}
