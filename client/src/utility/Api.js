const API_PORT = 3001;
const BASE_URL = `http://localhost:${API_PORT}/api`;

/**
 * Handles requests by fetching data from the server in a standardized manner.
 * 
 * @param {*} route The api route (starting with / )
 * @param {*} method GET/POST/PUT/DELETE
 * @param {*} errorContext Some textual description of the context of this method.
 * @param {*} body optional; the body of the request
 * @param {*} resFormat optional; the format of the response e.g. JSON; default is true
 * @returns response in the requested format if response is ok
 */
export default async function sendRequest(route, method, errorContext, body, resFormat) {
  const FULL_URL = BASE_URL + route;
  body = body? JSON.stringify(body): undefined;
  try {
    const res = body
      ? await fetch(FULL_URL, {
          method: method,
          body: body,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
      :  await fetch(FULL_URL, { method: method, credentials: "include" });
    if (res.ok) {
        switch(resFormat){
            case "JSON":
                return res.json();
            default:
                return true;
        }
    } else {
      const httpAndContextInfo = 404 + " Http error at " +  errorContext;
      const resolvedResponse = await res.json();
      const message = resolvedResponse.message?resolvedResponse.message:"";
      throw new Error( httpAndContextInfo +": " +resolvedResponse.message);
    }
  } catch (exception) {
    throw new Error(exception.message);
  }
}
