import PDFJSAnnotate from '../';
import * as $ from 'jquery';
const jsonString = '[]';
console.log('Jquery is working');

const { UI } = PDFJSAnnotate;
let documentId;
let documentPath;
let devicePlateform;
let PAGE_HEIGHT;
let RENDER_OPTIONS = {
  documentId: documentId,
  pdfDocument: null,
  documentPath: documentPath,
  scale: parseFloat(localStorage.getItem(`${documentId}/scale`), 10) || 1.33,
  rotate: parseInt(localStorage.getItem(`${documentId}/rotate`), 10) || 0
};

PDFJSAnnotate.setStoreAdapter(new PDFJSAnnotate.LocalStoreAdapter());
let globalStoreAdapter = PDFJSAnnotate.getStoreAdapter();
pdfjsLib.workerSrc = './shared/pdf.worker.js';

// Render stuff
let NUM_PAGES = 0;
let renderedPages = [];
let okToRender = false;

document.getElementById('content-wrapper').addEventListener('scroll', (e) => {
  let visiblePageNum = Math.round(e.target.scrollTop / PAGE_HEIGHT) + 1;
  let visiblePage = document.querySelector(`.page[data-page-number="${visiblePageNum}"][data-loaded="false"]`);

  if (renderedPages.indexOf(visiblePageNum) === -1) {
    okToRender = true;
    renderedPages.push(visiblePageNum);
  }
  else {
    okToRender = false;
  }

  if (visiblePage && okToRender) {
    setTimeout(() => {
      UI.renderPage(visiblePageNum, RENDER_OPTIONS);
    });
  }
});

// code for communication with mobile and desktop device for loading pdf files in view
document.updateFromNative = function(documentId, documentPath, jsonStructure, plateform) {
  if (!documentPath) {
    // eslint-disable-next-line no-undef
    JSBridge.showMessageInNative('PDF path is invalid or pdf does not exists');
    return;
  }
  let isStorageSet = new Promise(function(resolve, reject) {
    if (plateform === 'android') {
      $.getJSON(jsonStructure, function(data) {
        jsonStructure = JSON.stringify(data);
        if (setLocalJson(jsonStructure, documentId)) {
          resolve(true);
          devicePlateform = plateform;
        }
        else {
          reject('Error initializing the storage value received is' + typeof jsonStructure);
        }
      });
    }
    else {
      if (setLocalJson(jsonStructure, documentId)) {
        resolve(true);
        devicePlateform = plateform;
      }
      else {
        reject('Error initializing the storage value received is' + typeof jsonStructure);
      }
    }
  });

  isStorageSet.then(function(ret) {
    console.log('Promise resolved value is ' + ret);
    RENDER_OPTIONS.documentId = documentId;
    RENDER_OPTIONS.documentPath = documentPath;
    initPenWrapper();
  }, function(res) {
    console.error(res);
    // eslint-disable-next-line no-undef
    JSBridge.localStorageSetupErrorCallback(res);
  });
};

document.getElementById('saveButton').addEventListener('click', sendLocalJsonToNative);

function sendLocalJsonToNative() {
  console.log('Sending annotations to ==> ' + devicePlateform + '<==Device');
  let promise = globalStoreAdapter.getAllAnnotations(RENDER_OPTIONS.documentId);
  promise.then((data) => {
    switch (devicePlateform) {
      case 'android':
        // eslint-disable-next-line no-undef
        JSBridge.jsonContentCallback(RENDER_OPTIONS.documentId, JSON.stringify(data.annotations));
        break;
      case 'ios':
        let appName = 'credowebview';
        let actionType = 'printcallback';
        let jsonString = (JSON.stringify(data.annotations));
        let escapedJsonParameters = escape(jsonString);
        let url = appName + '://' + actionType + '#' + escapedJsonParameters;
        // var url = appName + '://' + actionType + "#" + jsonString;
        document.location.href = url;
        break;
      case 'desktop':
        window.Bridge.save_json_data(RENDER_OPTIONS.documentId, JSON.stringify(data.annotations));
        break;
      default:
        console.error('Plateform Received is: ' + devicePlateform);
        return;
    }
  });
}

function setLocalJson(jsonContent, documentId) {
  // TODO  check for incoming content if it is string or json object
  localStorage.setItem(`${documentId}/annotations`, jsonContent);
  return true;
}

setTimeout(() => {
  document.updateFromNative('example.pdf', '../example.pdf', '../test.json', 'android');
}, 100);

function getPdfId() {
  if (!RENDER_OPTIONS.documentId) {
    console.log(`Polling documentId variable and documentId value is ${documentId}`);
    setTimeout(function() {
      getPdfId();
    }, 1000);
  }
  else {
    render();
  }
}
getPdfId();

function render() {
  const loadingTask = pdfjsLib.getDocument({
    url: RENDER_OPTIONS.documentPath,
    cMapUrl: 'shared/cmaps/',
    cMapPacked: true
  });

  loadingTask.promise.then((pdf) => {
    RENDER_OPTIONS.pdfDocument = pdf;

    let viewer = document.getElementById('viewer');
    viewer.innerHTML = '';
    NUM_PAGES = pdf.numPages;
    for (let i = 0; i < NUM_PAGES; i++) {
      let page = UI.createPage(i + 1);
      viewer.appendChild(page);
    }

    UI.renderPage(1, RENDER_OPTIONS).then(([pdfPage, annotations]) => {
      let viewport = pdfPage.getViewport({scale: RENDER_OPTIONS.scale, rotation: RENDER_OPTIONS.rotate});
      PAGE_HEIGHT = viewport.height;
    });
  });
}

(function() {
  function touchHandler(event) {
    let touches = event.changedTouches;
    let first = touches[0];
    let type = '';
    switch (event.type) {
      case 'touchstart': type = 'mousedown'; break;
      case 'touchmove': type = 'mousemove'; break;
      case 'touchend': type = 'mouseup'; break;
      default: return;
    }

    let simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(
      type, true, true, window, 1,
      first.screenX, first.screenY,
      first.clientX, first.clientY, false,
      false, false, false, 0/* left */, null);
    first.target.dispatchEvent(simulatedEvent);
    if (first.target.className.baseVal === 'annotationLayer') {
      event.preventDefault();
    }
  }
  // add  event listners for the
  document.addEventListener('touchstart', touchHandler, { passive: false });
  document.addEventListener('touchmove', touchHandler, { passive: false });
  document.addEventListener('touchend', touchHandler, { passive: false });
  document.addEventListener('touchcancel', touchHandler, { passive: false });
})();

// Pen stuff
function initPenWrapper() {
  let penSize;
  let penColor;

  function initPen() {
    setPen(
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/size`) || 1,
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/color`) || '#000000'
    );
  }

  function setPen(size, color) {
    let modified = false;
    if (penSize !== size) {
      modified = true;
      penSize = size;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/size`, penSize);
      document.querySelector('.toolbar .pen-size').value = penSize;
    }

    if (penColor !== color) {
      modified = true;
      penColor = color;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/color`, penColor);

      let selected = document.querySelector('.toolbar .pen-color.color-selected');
      if (selected) {
        selected.classList.remove('color-selected');
        selected.removeAttribute('aria-selected');
      }

      selected = document.querySelector(`.toolbar .pen-color[data-color="${color}"]`);
      if (selected) {
        selected.classList.add('color-selected');
        selected.setAttribute('aria-selected', true);
      }
    }

    if (modified) {
      UI.setPen(penSize, penColor);
    }
  }

  function handlePenSizeChange(e) {
    if (e.currentTarget.getAttribute('data-tool-type') === 'line-width') {
      let width = e.currentTarget.getAttribute('data-value');
      setPen(width, penColor);
    }
  }

  function handlePenColorChange(e) {
    let color = e.currentTarget.getAttribute('data-value');
    setPen(penSize, color);
  }
  document.querySelectorAll('a[data-tool-type]').forEach(item => {
    item.addEventListener('click', event => {
      // handle click
      handlePenSizeChange(event);
    });
  });

  document.querySelectorAll('a.tool-color').forEach(item => {
    item.addEventListener('click', event => {
      // handle click
      handlePenColorChange(event);
    });
  });
  initPen();
}

// Toolbar buttons
(function() {
  let tooltype = localStorage.getItem(`${RENDER_OPTIONS.documentId}/tooltype`) || 'cursor';
  if (tooltype) {
    setActiveToolbarItem(tooltype, document.querySelector(`.toolbar button[data-tool-type=${tooltype}]`));
  }

  function setActiveToolbarItem(type, button) {
    let active = document.querySelector('.toolbar button.active');
    if (active) {
      active.classList.remove('active');
      switch (tooltype) {
        case 'cursor':
          UI.disableEdit();
          break;
        case 'eraser':
          UI.disableEraser();
          break;
        case 'draw':
          UI.disablePen();
          break;
        case 'arrow':
          UI.disableArrow();
          break;
        case 'text':
          UI.disableText();
          break;
        case 'point':
          UI.disablePoint();
          break;
        case 'area':
        case 'highlight':
        case 'strikeout':
          UI.disableRect();
          break;
        case 'circle':
        case 'emptycircle':
        case 'fillcircle':
          UI.disableCircle();
          break;
      }
    }

    if (button) {
      button.classList.add('active');
    }
    if (tooltype !== type) {
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/tooltype`, type);
    }
    tooltype = type;

    switch (type) {
      case 'cursor':
        UI.enableEdit();
        break;
      case 'eraser':
        UI.enableEraser();
        break;
      case 'draw':
        UI.enablePen();
        break;
      case 'arrow':
        UI.enableArrow();
        break;
      case 'text':
        UI.enableText();
        break;
      case 'point':
        UI.enablePoint();
        break;
      case 'area':
      case 'highlight':
      case 'strikeout':
        UI.enableRect(type);
        break;
      case 'circle':
      case 'emptycircle':
      case 'fillcircle':
        UI.enableCircle(type);
        break;
    }
  }

  function handleToolbarClick(e) {
    if (e.currentTarget.nodeName === 'BUTTON') {
      setActiveToolbarItem(e.currentTarget.getAttribute('data-tool-type'), e.currentTarget);
    }
  }
  document.querySelectorAll('button[data-tool-type]').forEach(item => {
    item.addEventListener('click', event => {
      // handle click
      handleToolbarClick(event);
    });
  });
})();

// Handle book marks in pdf

(function(document, window){
  function handleBookmarks(e){
    debugger;

  }
  document.getElementById('bookmark-button').addEventListener('click', handleBookmarks)

})(document, window);




// Scale/rotate
// (function() {
//   function setScaleRotate(scale, rotate) {
//     scale = parseFloat(scale, 10);
//     rotate = parseInt(rotate, 10);
//
//     if (RENDER_OPTIONS.scale !== scale || RENDER_OPTIONS.rotate !== rotate) {
//       RENDER_OPTIONS.scale = scale;
//       RENDER_OPTIONS.rotate = rotate;
//
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/scale`, RENDER_OPTIONS.scale);
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/rotate`, RENDER_OPTIONS.rotate % 360);
//
//       render();
//     }
//   }
//
//   function handleScaleChange(e) {
//     setScaleRotate(e.target.value, RENDER_OPTIONS.rotate);
//   }
//
//   function handleRotateCWClick() {
//     setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate + 90);
//   }
//
//   function handleRotateCCWClick() {
//     setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate - 90);
//   }
//
//   document.querySelector('.toolbar select.scale').value = RENDER_OPTIONS.scale;
//   document.querySelector('.toolbar select.scale').addEventListener('change', handleScaleChange);
//   document.querySelector('.toolbar .rotate-ccw').addEventListener('click', handleRotateCCWClick);
//   document.querySelector('.toolbar .rotate-cw').addEventListener('click', handleRotateCWClick);
// })();

// Clear toolbar button
// (function() {
//   function handleClearClick() {
//     if (confirm('Are you sure you want to clear annotations?')) {
//       for (let i = 0; i < NUM_PAGES; i++) {
//         document.querySelector(`div#pageContainer${i + 1} svg.annotationLayer`).innerHTML = '';
//       }
//
//       localStorage.removeItem(`${RENDER_OPTIONS.documentId}/annotations`);
//     }
//   }
//   document.querySelector('a.clear').addEventListener('click', handleClearClick);
// })();

// Comment stuff
// (function(window, document) {
//   let commentList = document.querySelector('#comment-wrapper .comment-list-container');
//   let commentForm = document.querySelector('#comment-wrapper .comment-list-form');
//   let commentText = commentForm.querySelector('input[type="text"]');
//
//   function supportsComments(target) {
//     let type = target.getAttribute('data-pdf-annotate-type');
//     return ['point', 'highlight', 'area'].indexOf(type) > -1;
//   }
//
//   function insertComment(comment) {
//     let child = document.createElement('div');
//     child.className = 'comment-list-item';
//     child.innerHTML = htmlEscape(comment.content);
//
//     commentList.appendChild(child);
//   }
//
//   function handleAnnotationClick(target) {
//     if (supportsComments(target)) {
//       let documentId = target.parentNode.getAttribute('data-pdf-annotate-document');
//       let annotationId = target.getAttribute('data-pdf-annotate-id');
//
//       PDFJSAnnotate.getStoreAdapter().getComments(documentId, annotationId).then((comments) => {
//         commentList.innerHTML = '';
//         commentForm.style.display = '';
//         commentText.focus();
//
//         commentForm.onsubmit = function() {
//           PDFJSAnnotate.getStoreAdapter().addComment(documentId, annotationId, commentText.value.trim())
//             .then(insertComment)
//             .then(() => {
//               commentText.value = '';
//               commentText.focus();
//             });
//
//           return false;
//         };
//
//         comments.forEach(insertComment);
//       });
//     }
//   }
//
//   function handleAnnotationBlur(target) {
//     if (supportsComments(target)) {
//       commentList.innerHTML = '';
//       commentForm.style.display = 'none';
//       commentForm.onsubmit = null;
//
//       insertComment({content: 'No comments'});
//     }
//   }
//
//   UI.addEventListener('annotation:click', handleAnnotationClick);
//   UI.addEventListener('annotation:blur', handleAnnotationBlur);
//
//   UI.setArrow(10, 'darkgoldenrod');
//   UI.setCircle(10, 'darkgoldenrod');
// })(window, document);
