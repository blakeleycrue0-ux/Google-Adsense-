import { CONSENT_KEY_SERVER } from "./constants";

/**
 * Valores por defecto de Google Consent Mode v2 (todo denegado) y restauración
 * de la elección guardada. Debe ejecutarse antes que cualquier etiqueta de Google.
 */
export function ConsentDefaults() {
  const js = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',false);
try{var c=JSON.parse(localStorage.getItem('${CONSENT_KEY_SERVER}'));if(c&&c.v===1){gtag('consent','update',{analytics_storage:c.analytics?'granted':'denied',ad_storage:c.ads?'granted':'denied',ad_user_data:c.ads?'granted':'denied',ad_personalization:c.ads?'granted':'denied'});}}catch(e){}`;
  return <script id="consent-defaults" dangerouslySetInnerHTML={{ __html: js }} />;
}
