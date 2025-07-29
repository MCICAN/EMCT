import { Suite } from "./models/Suite.js";
import { SuiteRenderer } from "./services/SuiteRenderer.js";
import { ThreeDRenderer } from "./services/ThreeDRenderer.js";
import { LanguageService } from "./services/LanguageService.js";
import { OutcomeService } from "./services/OutcomeService.js";
import { NavigationController } from "./controllers/NavigationController.js";
import { SuiteController } from "./controllers/SuiteController.js";
import { LanguageController } from "./controllers/LanguageController.js";
import { $, all } from "./utilities/domUtils.js";

// --- MOBILE BLOCKER ---
// Detecta mobile por largura de tela OU user agent
function isMobileDevice() {
  return window.innerWidth < 768 || /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showMobileBlockMessage() {
  // Esconde o page_loader se existir
  const loader = document.getElementById('page_loader');
  if (loader) loader.style.display = 'none';

  // Cria um overlay apenas sobre a .structure, sem remover o conteúdo
  const structure = document.querySelector('.structure');
  if (!structure) return;

  let blocker = document.getElementById('mobile_blocker_overlay');
  if (!blocker) {
    blocker = document.createElement('div');
    blocker.id = 'mobile_blocker_overlay';
    blocker.style.position = 'absolute';
    blocker.style.top = 0;
    blocker.style.left = 0;
    blocker.style.width = '100%';
    blocker.style.height = '100%';
    blocker.style.background = 'rgba(255, 255, 255, 0.96)';
    blocker.style.zIndex = 9999;
    blocker.style.display = 'flex';
    blocker.style.flexDirection = 'column';
    blocker.style.alignItems = 'center';
    blocker.style.justifyContent = 'center';
    blocker.style.textAlign = 'center';
    blocker.style.pointerEvents = 'all';

    blocker.innerHTML = `
      <h2
        data-language="mobile_block_message"
        data-language-original="This feature is not available on mobile devices.<br>Please visit from a desktop browser."
        style="font-size:1.3em;font-weight:bold;margin-bottom:1em;">
        This feature is not available on mobile devices.<br>
        Please visit from a desktop browser.
      </h2>
    `;
    structure.style.position = 'relative'; // Garante que o overlay fique posicionado corretamente
    structure.appendChild(blocker);
  }
}

// Executa após o conteúdo carregar normalmente
if (isMobileDevice()) {
  window.addEventListener('load', () => {
    // Inicialize normalmente todos os serviços, inclusive o LanguageController
    const canvas = $("#suiteCanvas");
    const ctx = canvas.getContext("2d");
    const suite = new Suite(false, true);
    const suiteRenderer = new SuiteRenderer(ctx, suite, 1, 1);
    const threeDRenderer = new ThreeDRenderer(suite, 1, 1);
    const languageService = new LanguageService();
    const outcomeService = new OutcomeService();
    const navigationController = new NavigationController(suite, suiteRenderer, threeDRenderer, languageService, outcomeService);
    const languageController = new LanguageController(languageService, outcomeService, suite, suiteRenderer, navigationController, "en");
    const suiteController = new SuiteController(canvas, suite, suiteRenderer, threeDRenderer, navigationController, languageService, outcomeService);

    // Só depois de tudo carregado, bloqueie a .structure
    showMobileBlockMessage();
  });
} else {
  window.addEventListener("load", () => {
  	const canvas = $("#suiteCanvas");
  	const ctx = canvas.getContext("2d");
  	
  	// Create an empty suite
  	const suite = new Suite(false, true);
  	
  	// Create a suite renderer
  	const suiteRenderer = new SuiteRenderer(ctx, suite, 1, 1);
  	
  	// Create a 3D renderer
  	const threeDRenderer = new ThreeDRenderer(suite, 1, 1);
  	
  	// Create a language service
  	const languageService = new LanguageService();
  	
  	// Create an outcome service
  	const outcomeService = new OutcomeService();
  	
  	// Create a navigation controller
  	const navigationController = new NavigationController(suite, suiteRenderer, threeDRenderer, languageService, outcomeService);
  	
  	// Create a language controller (page_loader is removed in LanguageService.loadLanguage())
  	const languageController = new LanguageController(languageService, outcomeService, suite, suiteRenderer, navigationController, "en");
  	
  	// Create a suite controller
  	const suiteController = new SuiteController(canvas, suite, suiteRenderer, threeDRenderer, navigationController, languageService, outcomeService);
  });
  
  document.addEventListener('DOMContentLoaded', function() {
    const structure  = document.querySelector('.structure');
    const menuToggle = document.querySelector('.menu-toggle');
  
    function updateMenuToggleVisibility() {
      menuToggle.style.display = structure.classList.contains('sidebar-closed')
        ? 'block'
        : 'none';
    }
  
    function initDesktop() {
      // só sobe o listener em telas largas
      if (window.innerWidth <= 767) return;
  
      updateMenuToggleVisibility();
      document.body.addEventListener('click', desktopHandler);
    }
  
    function desktopHandler(e) {
      const toggleBtn      = e.target.closest('[data-sidebar-toggle]');
      const closeBtnInside = e.target.closest('.sidebar-close-btn-inside');
  
      if (toggleBtn && structure) {
        e.preventDefault();
        structure.classList.toggle('sidebar-closed');
        updateMenuToggleVisibility();
      }
      if (closeBtnInside && structure) {
        e.preventDefault();
        structure.classList.add('sidebar-closed');
        updateMenuToggleVisibility();
      }
    }
  
    window.addEventListener('resize', initDesktop);
    initDesktop();
  
  
    // Fade effect logic
    var info = document.querySelector(".element_wrap[data-sidebar-type='step_1_instruction'] .input_group.information");
    if(info) {
      function checkFade() {
        if (info.scrollTop > 0) {
          info.classList.add('at-bottom');
        } else {
          info.classList.remove('at-bottom');
        }
      }
      info.addEventListener('scroll', checkFade);
      checkFade();
    }
  
    // Step 4 range sliders dynamic fill
    const step4Sliders = document.querySelectorAll(
      ".element_wrap[data-sidebar-type='step_4_instruction'] input[type=range]"
    );
    step4Sliders.forEach(slider => {
      // Initial fill
      updateStep4RangeSliderFill(slider);
      // Update on input
      slider.addEventListener('input', function() {
        updateStep4RangeSliderFill(slider);
      });
    });
  });
  
  // Dynamic gold fill for Step 4 range sliders
  function updateStep4RangeSliderFill(slider) {
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const val = Number(slider.value);
    const percent = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--percent', percent + '%');
  }
}