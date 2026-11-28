import {test,expect} from '@playwright/test';
test('granted persistent storage is a status and not another permission request',async({page})=>{
 await page.addInitScript(()=>{
  window.mockPersistent=true;window.persistenceCalls=0;
  const estimate=async()=>({usage:1048576});
  Object.defineProperty(navigator,'storage',{value:{estimate,persisted:async()=>window.mockPersistent,persist:()=>{window.persistenceCalls++;return new Promise(resolve=>window.finishPersistence=resolve);}},configurable:true});
 });
 await page.goto('/pwa/');await page.locator('#infoButton').click();
 await expect(page.locator('#storageDetails')).toContainText('Dauerhafter Speicher ist aktiv.');await expect(page.locator('#persistStorage')).toBeHidden();
 await expect(page.locator('#storageDetails')).toContainText('Geschätzter Browser-Speicher für diese Website: 1 MiB.');
 const settings=page.locator('#infoDialog');
 await settings.getByText('Installation und Offline-Nutzung', {exact:true}).click();
 await expect(settings.getByText('Als Web-App öffnen', {exact:true})).toBeVisible();
 await expect(settings.getByRole('link', {name:'Installationsanleitung öffnen'})).toHaveAttribute('href', 'https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/installation.html');
 await expect(settings.locator('#offlineDetails')).toContainText('Für Videos im Geräteordner muss der Ordnerzugriff erlaubt sein.');
 expect(await page.evaluate(()=>window.persistenceCalls)).toBe(0);
 await page.locator('#closeInfoTop').click();await page.evaluate(()=>window.mockPersistent=false);await page.locator('#infoButton').click();
 await expect(page.locator('#persistStorage')).toBeVisible();await page.locator('#persistStorage').click();
 await expect(page.locator('#persistStorage')).toBeDisabled();await expect(page.locator('#persistStorage')).toHaveAttribute('aria-busy','true');
 await page.evaluate(()=>{window.mockPersistent=true;window.finishPersistence(true);});
 await expect(page.locator('#persistStorage')).toBeHidden();await expect(page.locator('#storageDetails')).toContainText('Dauerhafter Speicher ist aktiv.');
 await page.locator('#closeInfoTop').click();await page.locator('#infoButton').click();await expect(page.locator('#persistStorage')).toBeHidden();
 expect(await page.evaluate(()=>window.persistenceCalls)).toBe(1);
});
test('a declined request can be retried and unsupported requests are hidden',async({page})=>{
 await page.addInitScript(()=>{
  const estimate=navigator.storage.estimate.bind(navigator.storage);
  Object.defineProperty(navigator,'storage',{value:{estimate,persisted:async()=>false,persist:async()=>false},configurable:true});
 });
 await page.goto('/pwa/');await page.locator('#infoButton').click();await page.locator('#persistStorage').click();
 await expect(page.locator('#persistenceResult')).toContainText('nicht bestätigt');await expect(page.locator('#persistStorage')).toBeEnabled();
 await page.locator('#closeInfoTop').click();await page.evaluate(()=>Object.defineProperty(navigator.storage,'persist',{value:undefined,configurable:true}));
 await page.locator('#infoButton').click();await expect(page.locator('#persistStorage')).toBeHidden();
});
