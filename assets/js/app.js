import * as config from "./configurations/config.js";
import { Suite } from "./models/Suite.js?v=20250503";
import { SuiteRenderer } from "./services/SuiteRenderer.js?v=20250503";
import { ThreeDRenderer } from "./services/ThreeDRenderer.js?v=20250503";
import { LanguageService } from "./services/LanguageService.js?v=20250503";
import { OutcomeService } from "./services/OutcomeService.js?v=20250503";
import { NavigationController } from "./controllers/NavigationController.js?v=20250503";
import { SuiteController } from "./controllers/SuiteController.js?v=20250503";
import { LanguageController } from "./controllers/LanguageController.js?v=20250503";
import { $, all } from "./utilities/domUtils.js?v=20250503";
import { MouseTracker } from "./utilities/mouseTracker.js?v=20250503";

window.addEventListener("load", () => {
	const canvas = $("#suiteCanvas");
	if (!canvas) return; // Corrige erro caso canvas não exista
	const ctx = canvas.getContext("2d");

	const undoStack = [];
	const maxUndo = 20; // Limite máximo de passos salvos

	// Salva o estado atual do canvas
	function saveState() {
		if (undoStack.length >= maxUndo) {
			undoStack.shift(); // Remove o mais antigo se passar do limite
		}
		undoStack.push(canvas.toDataURL());
	}

	// Faz o undo restaurando o último estado salvo
	function undo() {
		if (undoStack.length > 0) {
			const imgData = undoStack.pop();
			const img = new Image();
			img.src = imgData;
			img.onload = function () {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
			};
		}
	}

	// Exemplo de ação no canvas (desenhar algo ao clicar)
	canvas.addEventListener("click", (e) => {
		saveState();
		ctx.fillStyle = "blue";
		ctx.beginPath();
		ctx.arc(e.offsetX, e.offsetY, 20, 0, Math.PI * 2);
		ctx.fill();
	});

	// Botão de undo
	const undoBtn = document.getElementById("undoBtn");
	if (undoBtn) {
		undoBtn.addEventListener("click", undo);
	}

	// Atalho de teclado Ctrl+Z
	document.addEventListener("keydown", (e) => {
		if (e.ctrlKey && e.key === "z") {
			undo();
		}
	});

	// Start tracking the mouse as soon as app loads
	MouseTracker.init(canvas);
	
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
  // Sidebar close/open logic
  var structure = document.querySelector('.structure');
  var menuToggle = document.querySelector('.menu-toggle');

  function updateMenuToggleVisibility() {
    if (structure.classList.contains('sidebar-closed')) {
      menuToggle.style.display = 'block';
    } else {
      menuToggle.style.display = 'none';
    }
  }

  // Atualiza a visibilidade do menu toggle ao carregar a página
  updateMenuToggleVisibility();

  document.body.addEventListener('click', function(e) {
    var toggleBtn = e.target.closest('[data-sidebar-toggle]');
    if (toggleBtn && structure) {
      e.preventDefault();
      structure.classList.toggle('sidebar-closed');
      updateMenuToggleVisibility();
    }
    var closeBtnInside = e.target.closest('.sidebar-close-btn-inside');
    if (closeBtnInside && structure) {
      e.preventDefault();
      structure.classList.add('sidebar-closed');
      updateMenuToggleVisibility();
    }
  });

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