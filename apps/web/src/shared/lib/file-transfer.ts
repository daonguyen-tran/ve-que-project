/*
 * Faire sortir un fichier de l'appli : le télécharger, ou le partager (Android).
 */

/** Télécharge un texte comme fichier (dossier Téléchargements sur PC et sur Android). */
export function downloadTextFile(fileName: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Le navigateur a besoin de l'URL le temps de démarrer le téléchargement.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Vrai si l'appareil sait partager un fichier vers une autre appli (Drive, Gmail, Messenger…).
 * C'est le cas de Chrome sur Android ; rarement sur PC, où l'on télécharge.
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  const probe = new File(['{}'], 'test.json', { type: 'application/json' });
  return navigator.canShare({ files: [probe] });
}

/**
 * Ouvre la feuille de partage du système avec le fichier.
 * Renvoie `false` si l'utilisateur a fermé la feuille sans partager (ce n'est pas une erreur).
 */
export async function shareTextFile(
  fileName: string,
  text: string,
  title: string,
): Promise<boolean> {
  const file = new File([text], fileName, { type: 'application/json' });
  try {
    await navigator.share({ files: [file], title });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    throw error;
  }
}
