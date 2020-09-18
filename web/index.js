import PDFJSAnnotate from '../';
import initColorPicker from './shared/initColorPicker';

const jsonString = '[{"type":"fillcircle","color":"#EF4437","cx":98.10855263157895,"cy":42.857142857142854,"r":10,"class":"Annotation","uuid":"34d5cddc-0994-48f1-bbef-d567cb7371a2","page":1},{"type":"fillcircle","color":"#EF4437","cx":217.65742481203006,"cy":42.10526315789473,"r":10,"class":"Annotation","uuid":"9260a7ca-b6da-4b7a-9cd3-ff6c37b4ea2b","page":1},{"type":"fillcircle","color":"#EF4437","cx":368.7852443609022,"cy":42.857142857142854,"r":10,"class":"Annotation","uuid":"bcee7966-bba3-4a8b-8241-0170d95bcb48","page":1},{"type":"fillcircle","color":"#EF4437","cx":493.59727443609023,"cy":55.639097744360896,"r":10,"class":"Annotation","uuid":"94068b59-273b-439d-9079-c9bc1d69154b","page":1},{"type":"fillcircle","color":"#EF4437","cx":562.0183270676691,"cy":93.23308270676692,"r":10,"class":"Annotation","uuid":"e2912598-b1cb-47b8-8ace-136f2ed14efe","page":1},{"type":"arrow","width":10,"color":"#EF4437","lines":[[98.10855263157895,42.857142857142854],[107.88298872180451,51.127819548872175]],"class":"Annotation","uuid":"534ca99a-714c-4639-8c83-676b27204a13","page":1},{"type":"arrow","width":10,"color":"#EF4437","lines":[[217.65742481203006,42.10526315789473],[291.34163533834584,53.38345864661654]],"class":"Annotation","uuid":"79ec87b7-48ac-4a0f-9fa2-4793b49192d0","page":1},{"type":"emptycircle","color":"#F0592B","cx":31.943139097744357,"cy":89.47368421052632,"r":10,"class":"Annotation","uuid":"327a5ad6-5090-4b4e-98bf-d000747d5f83","page":1},{"type":"fillcircle","color":"#EF4437","cx":27.43186090225564,"cy":80.45112781954887,"r":10,"class":"Annotation","uuid":"717044c8-4a5b-4b3d-a7d5-d591f7c5dc3e","page":1},{"type":"fillcircle","color":"#EF4437","cx":27.43186090225564,"cy":80.45112781954887,"r":10,"class":"Annotation","uuid":"4b98c109-c503-4ffe-9181-d33200e67d27","page":1},{"type":"fillcircle","color":"#EF4437","cx":31.943139097744357,"cy":85.71428571428571,"r":10,"class":"Annotation","uuid":"98779db4-e07d-4da6-9fbb-43b879770cd8","page":1},{"type":"fillcircle","color":"#EF4437","cx":31.943139097744357,"cy":85.71428571428571,"r":10,"class":"Annotation","uuid":"073b3533-0fb0-487c-ab12-faa30d7036a2","page":1},{"type":"fillcircle","color":"#EF4437","cx":72.54464285714285,"cy":118.796992481203,"r":10,"class":"Annotation","uuid":"48f226e4-635a-4da8-b0f6-8534d553fd64","page":1},{"type":"fillcircle","color":"#EF4437","cx":107.13110902255639,"cy":121.80451127819548,"r":10,"class":"Annotation","uuid":"99074d80-7a64-4459-8629-8464b629cfa7","page":1},{"type":"fillcircle","color":"#EF4437","cx":293.5972744360902,"cy":108.27067669172932,"r":10,"class":"Annotation","uuid":"7489ec19-df83-429e-8322-35ee9c5f6696","page":1},{"type":"fillcircle","color":"#EF4437","cx":405.6273496240602,"cy":104.51127819548871,"r":10,"class":"Annotation","uuid":"f5c1f5f8-1bfe-4277-ab16-33b92c922f44","page":1},{"type":"fillcircle","color":"#EF4437","cx":443.9732142857143,"cy":103.7593984962406,"r":10,"class":"Annotation","uuid":"777f4ae7-b406-4707-ba28-5df25b5a8fcd","page":1},{"type":"fillcircle","color":"#EF4437","cx":444.72509398496237,"cy":108.27067669172932,"r":10,"class":"Annotation","uuid":"f361e4d1-27f5-4f6e-9a67-da4e60e9351f","page":1},{"type":"fillcircle","color":"#EF4437","cx":444.72509398496237,"cy":106.01503759398496,"r":10,"class":"Annotation","uuid":"5dfe9855-bb07-41f8-a3fa-b046bdfba60a","page":1},{"type":"fillcircle","color":"#EF4437","cx":434.19877819548867,"cy":128.57142857142856,"r":10,"class":"Annotation","uuid":"070c7aba-c43b-494f-b69e-39bf501b992a","page":1},{"type":"fillcircle","color":"#EF4437","cx":343.9732142857143,"cy":138.34586466165413,"r":10,"class":"Annotation","uuid":"6ed50e0b-a196-4656-8c0f-c9a64e1ff598","page":1},{"type":"fillcircle","color":"#EF4437","cx":231.19125939849621,"cy":144.3609022556391,"r":10,"class":"Annotation","uuid":"2de527e4-0bf9-4de5-a2c9-079afbeb1980","page":1},{"type":"fillcircle","color":"#EF4437","cx":158.25892857142856,"cy":149.62406015037593,"r":10,"class":"Annotation","uuid":"2c4ad9eb-1d95-4b87-855b-af0d47323a0f","page":1},{"type":"fillcircle","color":"#EF4437","cx":416.9055451127819,"cy":181.95488721804512,"r":10,"class":"Annotation","uuid":"de8d605c-3857-4bad-89f4-2cbbe87e5cdb","page":1}]';

function htmlEscape(text) {
  return text
    .replace('&', '&amp;')
    .replace('>', '&gt;')
    .replace('<', '&lt;')
    .replace('"', '&quot;')
    .replace("'", '&#39;');
}

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

    if (setLocalJson(jsonStructure, documentId)) {
      resolve(true);
      devicePlateform = plateform;
    }
    else {
      reject('Error initializing the storage value received is' + typeof jsonStructure);
    }
  });
  isStorageSet.then(function(ret) {
    console.log('Promise resolved value is ' + ret);
    RENDER_OPTIONS.documentId = documentId;
    RENDER_OPTIONS.documentPath = documentPath;
    initTextWrapper();
    initPenWrapper();
  }, function(res) {
    console.error(res);
    // eslint-disable-next-line no-undef
    JSBridge.localStorageSetupErrorCallback(res);
  });
};

document.getElementById('saveButton').addEventListener('click', sendLocalJsonToNative);

function sendLocalJsonToNative() {
  console.log('Sending annotations to' + devicePlateform + 'Device');
  switch (devicePlateform) {
    case 'android':
      let promise = globalStoreAdapter.getAllAnnotations(RENDER_OPTIONS.documentId);
      promise.then((data) => {
        console.log(data);
      });
      const filtered = Object.keys(localStorage)
        .filter(key => key.startsWith(RENDER_OPTIONS.documentId))
        .reduce((obj, key) => {
          obj[key] = localStorage[key];
          return obj;
        }, {});
      // eslint-disable-next-line no-undef
      JSBridge.jsonContentCallback(RENDER_OPTIONS.documentId, JSON.stringify(filtered));
      break;
    case 'ios':
      let appName = 'credowebview';
      let actionType = 'printcallback';
      let jsonString = JSON.stringify(localStorage);
      let url = appName + '://' + actionType + '#' + jsonString;
      document.location.href = url;
      break;
    default:
      console.error('Plateform Received is: ' + devicePlateform);
      return;
  }
}

function setLocalJson(jsonContent, documentId) {
  // TODO  check for incoming content if it is string or json object
  localStorage.setItem(`${documentId}/annotations`, jsonContent);
  return true;
}

setTimeout(() => {
  document.updateFromNative('example.pdf', '../example.pdf', jsonString, 'android');
}, 5000);

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

// Hotspot color stuff
(function() {
  let hotspotColor = localStorage.getItem(`${RENDER_OPTIONS.documentId}/hotspot/color`) || 'darkgoldenrod';
  let currentTarget;

  function handleAnnotationClick(target) {
    let type = target.getAttribute('data-pdf-annotate-type');
    if (['fillcircle', 'arrow'].indexOf(type) === -1) {
      return; // nothing to do
    }
    currentTarget = target;
    hotspotColor = currentTarget.getAttribute('stroke');

    UI.setArrow(10, hotspotColor);
    UI.setCircle(10, hotspotColor);

    let a = document.querySelector('.hotspot-color .color');
    if (a) {
      a.setAttribute('data-color', hotspotColor);
      a.style.background = hotspotColor;
    }
  }

  function handleAnnotationBlur(target) {
    if (currentTarget === target) {
      currentTarget = undefined;
    }
  }

  initColorPicker(document.querySelector('.hotspot-color'), hotspotColor, function(value) {
    if (value === hotspotColor) {
      return; // nothing to do
    }
    localStorage.setItem(`${RENDER_OPTIONS.documentId}/hotspot/color`, value);
    hotspotColor = value;

    UI.setArrow(10, hotspotColor);
    UI.setCircle(10, hotspotColor);

    if (!currentTarget) {
      return; // nothing to do
    }

    let type = currentTarget.getAttribute('data-pdf-annotate-type');
    let annotationId = currentTarget.getAttribute('data-pdf-annotate-id');
    if (['fillcircle', 'arrow'].indexOf(type) === -1) {
      return; // nothing to do
    }

    // update target
    currentTarget.setAttribute('stroke', hotspotColor);
    currentTarget.setAttribute('fill', hotspotColor);

    // update annotation
    PDFJSAnnotate.getStoreAdapter().getAnnotation(documentId, annotationId).then((annotation) => {
      annotation.color = hotspotColor;
      PDFJSAnnotate.getStoreAdapter().editAnnotation(documentId, annotationId, annotation);
    });
  });

  UI.addEventListener('annotation:click', handleAnnotationClick);
  UI.addEventListener('annotation:blur', handleAnnotationBlur);
})();

// Text stuff
function initTextWrapper() {
  let textSize;
  let textColor;

  function initText() {
    let size = document.querySelector('.toolbar .text-size');
    [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96].forEach((s) => {
      size.appendChild(new Option(s, s));
    });

    setText(
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/size`) || 10,
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/color`) || '#000000'
    );

    initColorPicker(document.querySelector('.text-color'), textColor, function(value) {
      setText(textSize, value);
    });
  }

  function setText(size, color) {
    let modified = false;

    if (textSize !== size) {
      modified = true;
      textSize = size;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/size`, textSize);
      document.querySelector('.toolbar .text-size').value = textSize;
    }

    if (textColor !== color) {
      modified = true;
      textColor = color;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/color`, textColor);

      let selected = document.querySelector('.toolbar .text-color.color-selected');
      if (selected) {
        selected.classList.remove('color-selected');
        selected.removeAttribute('aria-selected');
      }

      selected = document.querySelector(`.toolbar .text-color[data-color="${color}"]`);
      if (selected) {
        selected.classList.add('color-selected');
        selected.setAttribute('aria-selected', true);
      }
    }

    if (modified) {
      UI.setText(textSize, textColor);
    }
  }

  function handleTextSizeChange(e) {
    setText(e.target.value, textColor);
  }

  document.querySelector('.toolbar .text-size').addEventListener('change', handleTextSizeChange);

  initText();
}

// Pen stuff
function initPenWrapper() {
  let penSize;
  let penColor;

  function initPen() {
    let size = document.querySelector('.toolbar .pen-size');
    for (let i = 0; i < 20; i++) {
      size.appendChild(new Option(i + 1, i + 1));
    }

    setPen(
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/size`) || 1,
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/color`) || '#000000'
    );

    initColorPicker(document.querySelector('.pen-color'), penColor, function(value) {
      setPen(penSize, value);
    });
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
    setPen(e.target.value, penColor);
  }

  document.querySelector('.toolbar .pen-size').addEventListener('change', handlePenSizeChange);

  initPen();
}

// Toolbar buttons
(function() {
  let tooltype = localStorage.getItem(`${RENDER_OPTIONS.documentId}/tooltype`) || 'cursor';
  if (tooltype) {
    setActiveToolbarItem(tooltype, document.querySelector(`.toolbar button[data-tooltype=${tooltype}]`));
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
    if (e.target.nodeName === 'BUTTON') {
      setActiveToolbarItem(e.target.getAttribute('data-tooltype'), e.target);
    }
  }

  document.querySelector('.toolbar').addEventListener('click', handleToolbarClick);
})();

// Scale/rotate
(function() {
  function setScaleRotate(scale, rotate) {
    scale = parseFloat(scale, 10);
    rotate = parseInt(rotate, 10);

    if (RENDER_OPTIONS.scale !== scale || RENDER_OPTIONS.rotate !== rotate) {
      RENDER_OPTIONS.scale = scale;
      RENDER_OPTIONS.rotate = rotate;

      localStorage.setItem(`${RENDER_OPTIONS.documentId}/scale`, RENDER_OPTIONS.scale);
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/rotate`, RENDER_OPTIONS.rotate % 360);

      render();
    }
  }

  function handleScaleChange(e) {
    setScaleRotate(e.target.value, RENDER_OPTIONS.rotate);
  }

  function handleRotateCWClick() {
    setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate + 90);
  }

  function handleRotateCCWClick() {
    setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate - 90);
  }

  document.querySelector('.toolbar select.scale').value = RENDER_OPTIONS.scale;
  document.querySelector('.toolbar select.scale').addEventListener('change', handleScaleChange);
  document.querySelector('.toolbar .rotate-ccw').addEventListener('click', handleRotateCCWClick);
  document.querySelector('.toolbar .rotate-cw').addEventListener('click', handleRotateCWClick);
})();

// Clear toolbar button
(function() {
  function handleClearClick() {
    if (confirm('Are you sure you want to clear annotations?')) {
      for (let i = 0; i < NUM_PAGES; i++) {
        document.querySelector(`div#pageContainer${i + 1} svg.annotationLayer`).innerHTML = '';
      }

      localStorage.removeItem(`${RENDER_OPTIONS.documentId}/annotations`);
    }
  }
  document.querySelector('a.clear').addEventListener('click', handleClearClick);
})();

// Comment stuff
(function(window, document) {
  let commentList = document.querySelector('#comment-wrapper .comment-list-container');
  let commentForm = document.querySelector('#comment-wrapper .comment-list-form');
  let commentText = commentForm.querySelector('input[type="text"]');

  function supportsComments(target) {
    let type = target.getAttribute('data-pdf-annotate-type');
    return ['point', 'highlight', 'area'].indexOf(type) > -1;
  }

  function insertComment(comment) {
    let child = document.createElement('div');
    child.className = 'comment-list-item';
    child.innerHTML = htmlEscape(comment.content);

    commentList.appendChild(child);
  }

  function handleAnnotationClick(target) {
    if (supportsComments(target)) {
      let documentId = target.parentNode.getAttribute('data-pdf-annotate-document');
      let annotationId = target.getAttribute('data-pdf-annotate-id');

      PDFJSAnnotate.getStoreAdapter().getComments(documentId, annotationId).then((comments) => {
        commentList.innerHTML = '';
        commentForm.style.display = '';
        commentText.focus();

        commentForm.onsubmit = function() {
          PDFJSAnnotate.getStoreAdapter().addComment(documentId, annotationId, commentText.value.trim())
            .then(insertComment)
            .then(() => {
              commentText.value = '';
              commentText.focus();
            });

          return false;
        };

        comments.forEach(insertComment);
      });
    }
  }

  function handleAnnotationBlur(target) {
    if (supportsComments(target)) {
      commentList.innerHTML = '';
      commentForm.style.display = 'none';
      commentForm.onsubmit = null;

      insertComment({content: 'No comments'});
    }
  }

  UI.addEventListener('annotation:click', handleAnnotationClick);
  UI.addEventListener('annotation:blur', handleAnnotationBlur);

  UI.setArrow(10, 'darkgoldenrod');
  UI.setCircle(10, 'darkgoldenrod');
})(window, document);
