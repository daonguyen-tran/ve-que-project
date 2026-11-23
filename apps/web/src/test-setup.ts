import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sans les globals de Vitest, Testing Library ne nettoie pas le DOM tout seul entre deux tests.
afterEach(() => cleanup());

// jsdom n'implémente pas encore showModal()/close() de <dialog> : version minimale pour les tests.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
