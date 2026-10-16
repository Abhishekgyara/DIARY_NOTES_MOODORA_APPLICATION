import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  );
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    registerSW({ immediate: true });

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  if (installed) return null;

  return (
    <>
      <button
        className="btn btn-primary install-app-button"
        type="button"
        onClick={handleInstall}
        aria-label="Install Moodora app"
      >
        <Download size={17} />
        <span>Install app</span>
      </button>

      {showInstructions && (
        <div
          className="install-backdrop"
          onClick={() => setShowInstructions(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setShowInstructions(false);
          }}
        >
          <section
            aria-labelledby="install-title"
            aria-modal="true"
            className="install-dialog card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close install instructions"
              className="btn btn-icon btn-ghost install-close"
              onClick={() => setShowInstructions(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <h2 className="section-title" id="install-title">Install Moodora</h2>
            {isIos ? (
              <p className="section-subtitle">
                In Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="section-subtitle">
                Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
                If that option is not shown, try Chrome or Edge and make sure you are using the deployed HTTPS site.
              </p>
            )}
          </section>
        </div>
      )}

      <style>{`
        .install-app-button {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 90;
          box-shadow: 0 6px 24px var(--shadow-lg);
        }
        .install-backdrop {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 18, 25, 0.55);
          z-index: 2100;
        }
        .install-dialog {
          position: relative;
          width: min(100%, 440px);
          padding: 28px;
        }
        .install-dialog .section-title { margin: 0 32px 10px 0; }
        .install-dialog .section-subtitle { line-height: 1.7; }
        .install-close { position: absolute; top: 12px; right: 12px; }
        @media (max-width: 600px) {
          .install-app-button { right: 14px; bottom: 78px; }
        }
      `}</style>
    </>
  );
}
