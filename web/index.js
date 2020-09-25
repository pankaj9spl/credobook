import PDFJSAnnotate from '../';
import * as $ from 'jquery';
import uuid from '../src/utils/uuid';
const { UI } = PDFJSAnnotate;

const pairs = [];
let toolType;
let documentId;
let documentPath;
let devicePlateform;
let PAGE_HEIGHT;
let RENDER_OPTIONS = {
  documentId: documentId,
  pdfDocument: null,
  documentPath: documentPath,
  scale: parseFloat(localStorage.getItem(`${documentId}/scale`), 0.65) || 0.65,
  rotate: parseInt(localStorage.getItem(`${documentId}/rotate`), 10) || 0
};
let currentPage = 1;
PDFJSAnnotate.setStoreAdapter(new PDFJSAnnotate.LocalStoreAdapter());
let globalStoreAdapter = PDFJSAnnotate.getStoreAdapter();
pdfjsLib.workerSrc = './shared/pdf.worker.js';

// Render stuff
let NUM_PAGES = 0;
// let renderedPages = [];
// let okToRender = false;

// document.getElementById('content-wrapper').addEventListener('scroll', scrollListner);
// document.getElementById('content-wrapper').addEventListener('touchmove', scrollListner);
//
// function scrollListner(e) {
//   let visiblePageNum = Math.round(e.target.scrollTop / PAGE_HEIGHT) + 1;
//   currentPage = visiblePageNum;
//   let visiblePage = document.querySelector(`.page[data-page-number="${visiblePageNum}"][data-loaded="false"]`);
//
//   if (renderedPages.indexOf(visiblePageNum) === -1) {
//     okToRender = true;
//     renderedPages.push(visiblePageNum);
//   }
//   else {
//     okToRender = false;
//   }
//
//   if (visiblePage && okToRender) {
//     setTimeout(() => {
//       UI.renderPage(visiblePageNum, RENDER_OPTIONS);
//     });
//   }
// }

// code for communication with mobile and desktop device for loading pdf files in view
document.updateFromNative = function(documentId, documentPath, jsonStructure, plateform) {
  console.log('Update function called from ==> ', plateform);
  if (!documentPath) {
    // eslint-disable-next-line no-undef
    JSBridge.showMessageInNative('PDF path is invalid or pdf does not exists');
    return;
  }
  let isStorageSet = new Promise(function(resolve, reject) {
    if (plateform === 'android' || plateform === 'desktop') {
      $.getJSON(jsonStructure, function(data) {
        jsonStructure = JSON.stringify(data);
        setLocalJson(jsonStructure, documentId).then((response) => {
          devicePlateform = plateform;
          resolve(response);
        }, (err) => {
          console.error(err);
        });
      });
    }
    else {
      setLocalJson(jsonStructure, documentId).then((response) => {
        devicePlateform = plateform;
        resolve(response);
      }, (err) => {
        console.error(err);
      });
    }
  });

  isStorageSet.then(function(ret) {
    console.log('Promise resolved value is ' + ret);
    if (devicePlateform === 'desktop') {
      RENDER_OPTIONS.scale = 1.33;
    }
    RENDER_OPTIONS.documentId = documentId;
    RENDER_OPTIONS.documentPath = documentPath;
    initPenWrapper();
    setTimeout(() => {
      initBookMarks(document, window);
    }, 200);
  }, function(res) {
    console.error(res);
    // eslint-disable-next-line no-undef
    JSBridge.localStorageSetupErrorCallback(res);
  });
};

function setLocalJson(jsonContent, documentId) {
  // TODO  check for incoming content if it is string or json object
  return new Promise((resolve, reject) => {
    JSON.parse(jsonContent).forEach((item, index, array) => {
      if (item.annotations) {
        localStorage.setItem(`${documentId}/annotations`, JSON.stringify(item.annotations));
      }
      else {
        localStorage.setItem(`${documentId}/bookmarks`, JSON.stringify(item.bookmarks));
      }
      if (index === array.length - 1) resolve(true);
    });
  });
}

document.getElementById('saveButton').addEventListener('click', sendLocalJsonToNative);

function sendLocalJsonToNative() {
  console.log('Sending annotations to ==> ' + devicePlateform + ' <== Device');
  let bookmarks = globalStoreAdapter.getAllBookmarks(RENDER_OPTIONS.documentId);
  bookmarks.then((bookmarks) => {
    let annotations = globalStoreAdapter.getAllAnnotations(RENDER_OPTIONS.documentId);
    annotations.then((annotations) => {
      let allData = [
        { annotations: annotations.annotations},
        { bookmarks: bookmarks.bookmarks }
      ];
      console.info('Combined data is==> ', JSON.stringify(allData));
      switch (devicePlateform) {
        case 'android':
          // eslint-disable-next-line no-undef
          JSBridge.jsonContentCallback(RENDER_OPTIONS.documentId, JSON.stringify(allData));
          break;
        case 'ios':
          let appName = 'credowebview';
          let actionType = 'printcallback';
          let jsonString = (JSON.stringify(allData));
          let escapedJsonParameters = escape(jsonString);
          let url = appName + '://' + actionType + '#' + escapedJsonParameters;
          document.location.href = url;
          break;
        case 'desktop':
          window.Bridge.save_json_data(RENDER_OPTIONS.documentId, JSON.stringify(allData));
          break;
        default:
          console.error('Plateform Received is: ' + devicePlateform);
          return;
      }
    });
  });
}

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

function initTableOfContent(pdf) {
  pdf.getOutline().then(function(outline) {
    if (outline) {
      for (let i = 0; i < outline.length; i++) {
        const dest = outline[i].dest;
        // Get each page ref
        pdf.getDestination(dest).then(function(dest) {
          const ref = dest[0];
          // And the page id
          pdf.getPageIndex(ref).then(function(id) {
          // page number = index + 1
            pairs.push({ title: outline.title, pageNumber: parseInt(id) + 1 });
          });
        });
      }
    }
  });
}

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
    initTableOfContent(pdf);
    NUM_PAGES = pdf.numPages;
    for (let i = 0; i < NUM_PAGES; i++) {
      let page = UI.createPage(i + 1);
      viewer.appendChild(page);
    }
    for (let i = 0; i < NUM_PAGES; i++) {
      UI.renderPage(i + 1, RENDER_OPTIONS).then(([pdfPage, annotations]) => {
        let viewport = pdfPage.getViewport({scale: RENDER_OPTIONS.scale, rotation: RENDER_OPTIONS.rotate});
        PAGE_HEIGHT = viewport.height;
      });
    }
  });
}

(function() {
  function touchHandler(event) {
    let touches = event.changedTouches;
    let first = touches[0];
    let type = '';
    switch (event.type) {
      case 'touchstart':
        type = 'mousedown';
        break;
      case 'touchmove':
        type = 'mousemove';
        break;
      case 'touchend':
        type = 'mouseup';
        break;
      default:
        return;
    }

    let simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(
      type, true, true, window, 1,
      first.screenX, first.screenY,
      first.clientX, first.clientY, false,
      false, false, false, 0/* left */, null);
    first.target.dispatchEvent(simulatedEvent);
    if (first.target.className.baseVal === 'annotationLayer') {
      if (toolType === 'draw' || toolType === 'eraser') {
        event.preventDefault();
      }
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
    toolType = type;
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
function initBookMarks(document, window) {
  let bookMarkContainer = document.getElementById('bookMarkContainer');
  bookMarkContainer.innerHTML = '';

  function attachBookMarkToView(e) {
    e.innerHTML = '';
    let bookmarks = getBookMarks();
    for (let i = 1; i < NUM_PAGES; i++) {
      let pageBookMarks = bookmarks.filter((x) => x.page === i);
      if (pageBookMarks.length) {
        let bookmarkViewEle = createPageBookmarkView(i, pageBookMarks);
        e.appendChild(bookmarkViewEle);
      }
    }
  }

  function createPageBookmarkView(page, bookMarkList) {
    let div = document.createElement('div');
    div.classList += 'page-section';
    let h5 = document.createElement('h5');
    h5.classList += 'page-number';
    h5.textContent = `Page ${page}`;
    div.appendChild(h5);
    let ul = document.createElement('ul');
    ul.classList = ['list-unstyled  bookmark-list'];
    div.onclick = function(e) {
      let bookmarkHolder = e.currentTarget.querySelector('.bookmark-list');
      if (bookmarkHolder.childElementCount === 0) {
        e.currentTarget.remove();
      }
    };
    bookMarkList.forEach((bookmark) => {
      let li = document.createElement('li');
      let a = document.createElement('a');
      a.classList += 'list-text';
      a.textContent = `${bookmark.text}`;
      a.dataset.page = page;
      a.onclick = function(e) {
        document.getElementById(`pageContainer${page}`).scrollIntoView(true);
      };
      let button = document.createElement('button');
      button.className = 'btn';
      button.dataset.page = page;
      button.dataset.text = page;
      let image = document.createElement('img');
      image.src = 'resources/img/icons/delete.svg';
      button.addEventListener('click', function(e) {
        removeBookmark(bookmark.uuid);
        e.currentTarget.parentElement.parentElement.remove();
      });
      button.appendChild(image);
      a.appendChild(button);
      li.appendChild(a);
      ul.appendChild(li);
      div.appendChild(ul);
    });
    return div;
  }

  function getBookMarks() {
    return JSON.parse(localStorage.getItem(`${RENDER_OPTIONS.documentId}/bookmarks`)) || [];
  }

  function setBookMarks(bookMarks) {
    localStorage.setItem(`${RENDER_OPTIONS.documentId}/bookmarks`, JSON.stringify(bookMarks));
  }

  function addBookMark(text, pageNumber) {
    let bookMarks = getBookMarks();
    bookMarks.push({type: 'bookmark', class: 'Bookmarks', text: text, page: pageNumber, uuid: uuid()});
    setBookMarks(bookMarks);
    return true;
  }

  function removeBookmark(uuid) {
    let bookMarks = getBookMarks();
    bookMarks = bookMarks.filter((x) => x.uuid !== uuid);
    setBookMarks(bookMarks);
    return true;
  }

  function handleAddBookmark(e) {
    let bookmarkText = document.getElementById('bookmarkText');
    if (!bookmarkText.value) {
      alert('Please enter bookmark title');
      return;
    }
    let res = addBookMark(bookmarkText.value, currentPage);
    if (res) {
      let modal = document.getElementById('starPopuo');
      let modalBackdrop = document.querySelector('div.modal-backdrop');
      modal.classList.remove('show');
      modal.style.display = 'none';
      modalBackdrop.classList.remove('show');
      modalBackdrop.style.display = 'none';
      bookmarkText.value = '';
      attachBookMarkToView(bookMarkContainer);
    }
  }
  document.getElementById('bookmark-button').addEventListener('click', handleAddBookmark);
  document.querySelector('.bookmark-toggle').addEventListener('click', function() {
    let body = document.getElementById('body');
    if (!body.classList.contains('bookmark-open')) {
      attachBookMarkToView(bookMarkContainer);
    }
    body.classList.toggle('bookmark-open');
  });
}

// Search Handler
(function(document, window) {
  // global variable for search state
  let searchResults = [];
  let searchString;
  let inputHolder = document.querySelector('.table-input');
  let currentIndex = 0;

  function findByTextContent(needle, haystack, precise) {
  // needle: String, the string to be found within the elements.
  // haystack: String, a selector to be passed to document.querySelectorAll(),
  //           NodeList, Array - to be iterated over within the function:
  // precise: Boolean, true - searches for that precise string, surrounded by
  //                          word-breaks,
  //                   false - searches for the string occurring anywhere
    let elems;
    // no haystack we quit here, to avoid having to search
    // the entire document:
    if (!haystack) {
      return false;
    }
    // if haystack is a string, we pass it to document.querySelectorAll(),
    // and turn the results into an Array:
    else if (typeof haystack === 'string') {
      elems = [].slice.call(document.querySelectorAll(haystack), 0);
    }
    // if haystack has a length property, we convert it to an Array
    // (if it's already an array, this is pointless, but not harmful):
    else if (haystack.length) {
      elems = [].slice.call(haystack, 0);
    }

    // work out whether we're looking at innerText (IE), or textContent
    // (in most other browsers)
    let textProp = 'textContent' in document ? 'textContent' : 'innerText';
    // creating a regex depending on whether we want a precise match, or not:
    let reg = precise === true ? new RegExp('\\b' + needle + '\\b') : new RegExp(needle);
    // iterating over the elems array:
    let found = elems.filter(function(el) {
      // returning the elements in which the text is, or includes,
      // the needle to be found:
      return reg.test(el[textProp]);
    });
    return found.length ? found : false;
  }
  function updateSearchCounterDisplay() {
    document.getElementById('currentItemLabel').innerText = currentIndex;
    document.getElementById('allItemLabel').innerText = searchResults.length;
  }
  function findNextOccurance() {
    updateSearchCounterDisplay();
    if (inputHolder.value !== searchString) {
      searchString = inputHolder.value;
      currentIndex = 0;
      searchResults = findByTextContent(searchString, 'span', false);
    }
    if (searchResults) {
      if (currentIndex > 1) {
        let prevele = searchResults[currentIndex - 1];
        prevele.style.background = 'Transparent';
      }
      let nextResult = searchResults[currentIndex];

      if (nextResult) {
        nextResult.scrollIntoView(true);
        nextResult.style.background = 'yellow';
      }
      else {
        currentIndex = 0;
        let nextResult = searchResults[currentIndex];
        nextResult.scrollIntoView(true);
      }
      currentIndex += 1;
    }
  }
  function findPrevOccurance() {
    updateSearchCounterDisplay();
    if (inputHolder.value !== searchString) {
      searchString = inputHolder.value;
      searchResults = findByTextContent(searchString, 'span', false);
      currentIndex = searchResults.length - 1;
    }
    if (searchResults) {
      let prevele = searchResults[currentIndex];
      prevele.style.background = 'Transparent';
      let nextResult = searchResults[currentIndex - 1];

      if (nextResult) {
        nextResult.scrollIntoView(true);
        nextResult.style.background = 'yellow';
      }
      else {
        currentIndex = 0;
        let nextResult = searchResults[currentIndex];
        nextResult.scrollIntoView(true);
      }
      if (currentIndex === 0) {
        currentIndex = searchResults.length - 1;
      }
      else {
        currentIndex -= 1;
      }
    }
  }

  document.querySelector('.close-search').addEventListener('click', function(e) {
    searchResults = [];
    currentIndex = 0;
  });
  document.getElementById('searchNext').addEventListener('click', findNextOccurance);
  document.getElementById('searchPrev').addEventListener('click', findPrevOccurance);
})(document, window);
