import PDFJSAnnotate from '../';
import * as $ from 'jquery';
import uuid from '../src/utils/uuid';
const { UI } = PDFJSAnnotate;
import * as crypto from 'crypto';
import regeneratorRuntime from "regenerator-runtime";

let toolType;
let documentId;
let documentPath;
let devicePlateform;
let NUM_PAGES = 0;
let PASSWORD;
let PDF_DOC;
let ACTUAL_SCALE = 0.65;
let globalScale = parseFloat(localStorage.getItem(`${documentId}/scale`), 0.65) || 0.65;
let RENDER_OPTIONS = {
  documentId: documentId,
  pdfDocument: null,
  code: PASSWORD,
  documentPath: documentPath,
  scale: globalScale,
  rotate: parseInt(localStorage.getItem(`${documentId}/rotate`), 10) || 0
};
let currentPage = 1;
PDFJSAnnotate.setStoreAdapter(new PDFJSAnnotate.LocalStoreAdapter());
let globalStoreAdapter = PDFJSAnnotate.getStoreAdapter();
pdfjsLib.workerSrc = './shared/pdf.worker.js';

const ENC_KEY = 'bf3c199c2470cb477d907b1e0917c17b';
const IV = '5183666c72eec9e4';

function decrypt(encrypted) {
  let decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  return (decrypted + decipher.final('utf8'));
}

function toggleLoader(flag) {
  let loader = document.getElementById('loader');
  if (flag) {
    loader.classList.add('show-loader');
  }
  else {
    loader.classList.remove('show-loader');
  }
}

document.clearResource = async function() {
  await  document.querySelectorAll('canvas').forEach((item) => {
    let context = item.getContext('2d');
    context.clearRect(0, 0, item.width, item.height);
    item.height = 0;
    item.width = 0;
    item.style.width = 0;
    item.style.height = 0;
    console.log("canvas cleared")
  });
};

document.updateFromNative = function(documentId, documentPath, jsonStructure, plateform, passCode) {
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
    if (devicePlateform === 'desktop') {
      RENDER_OPTIONS.scale = 2.00;
      ACTUAL_SCALE = 1.50;
      globalScale = RENDER_OPTIONS.scale;
    }
    if (passCode) {
      RENDER_OPTIONS.code = decrypt(passCode);
      // RENDER_OPTIONS.code = passCode;
    }
    RENDER_OPTIONS.documentId = documentId;
    RENDER_OPTIONS.documentPath = documentPath;
    initPenWrapper();
    setTimeout(() => {
      initBookMarks(document, window);
    }, 200);
    // initialize the scale function after the viewport and scale has been initialize
    initScaleRotate();
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
    debugger;
    let lastPage = localStorage.getItem(`${RENDER_OPTIONS.documentId}/page`)
    if (parseInt(lastPage, 10)) {
      render(parseInt(lastPage, 10))
    }
    else {
      render(1);
    }
  }
}
getPdfId();

function render(page) {
  toggleLoader(true);
  let loadingTask;
  if (!PDF_DOC) {
    loadingTask = pdfjsLib.getDocument({
      url: RENDER_OPTIONS.documentPath,
      cMapUrl: 'shared/cmaps/',
      cMapPacked: true,
      password: RENDER_OPTIONS.code
    });
    loadingTask = loadingTask.promise;
  }
  else {
    loadingTask = new Promise((resolve, reject) => {
      resolve(PDF_DOC);
    });
  }
  // load the doc from cache
  document.clearResource();
  return new Promise(function( resolve, reject) {
    loadingTask.then((pdf) => {
      RENDER_OPTIONS.pdfDocument = pdf;
      PDF_DOC = pdf;
      let viewer = document.getElementById('viewer');
      viewer.innerHTML = '';
      NUM_PAGES = pdf.numPages;
      let pageToRender = UI.createPage(page);
      viewer.appendChild(pageToRender);
      UI.renderPage(page, RENDER_OPTIONS).then(() => {
        toggleLoader(false);
        resolve(true)
      });
      currentPage = page;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/page`, currentPage)
      setPageNumber();
    });
  });
}
// handler for page number
function setPageNumber() {
  document.getElementById('currentPage').value = currentPage || 1;
  document.getElementById('totalPages').innerText = NUM_PAGES;
}
setTimeout(setPageNumber, 400);

initPageNumberHandler();
function initPageNumberHandler() {
  document.getElementById('next').addEventListener('click', (event) => {
    if (currentPage < NUM_PAGES) {
      toggleLoader(true);
      currentPage += 1;
      render(currentPage);
      setPageNumber();
      setTimeout(toggleLoader(false), 100);
    }
  });
  document.getElementById('prev').addEventListener('click', (event) => {
    if (currentPage > 1) {
      toggleLoader(true);
      currentPage -= 1;
      render(currentPage);
      setPageNumber();
      setTimeout(toggleLoader(false), 400);
    }
  });
}

// touch mapper function
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

  // activate cursor tool on close button
  function activateCursor() {
    let cursorButton = document.querySelector('button[data-tool-type="cursor"]');
    setActiveToolbarItem('cursor', cursorButton);
  }
  document.querySelector('.close-button').addEventListener('click', activateCursor);
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
  let nav = document.querySelector('.more-buttons');
  let win = document.querySelector('#longPress');
  let closeButton = document.querySelector('.close-button');
  win.addEventListener('click', (event) => {
    nav.classList.add('show');
    let el = document.querySelector('button[data-tool-type="draw"]');
    setActiveToolbarItem('draw', el);
  });

  closeButton.addEventListener('click', (event) => {
    nav.classList.remove('show');
    nav.removeAttribute('style');
  });
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
        currentPage = page;
        render(page);
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
    console.log('Get value of bookmark input', bookmarkText.value);
    if (!bookmarkText.value) {
      alert('Please enter bookmark title');
      return;
    }
    let allSvgs = document.querySelectorAll('.annotationLayer');
    for (let i = 0; i < allSvgs.length; i++) {
      if (isElementInViewport(allSvgs[i])) {
        currentPage = parseInt(allSvgs[i].getAttribute('data-pdf-annotate-page'));
        console.log('current page is ', currentPage);
        break;
      }
    }
    function isElementInViewport(el) {
      let rect = el.getBoundingClientRect();

      return rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */ &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight);
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
    checkAndDisableDraw(false);
  }
  function checkAndDisableDraw(flag) {
    let tooltype = localStorage.getItem(`${RENDER_OPTIONS.documentId}/tooltype`) || 'cursor';
    if (tooltype === 'draw') {
      if (flag) {
        UI.disablePen();
      }
      else {
        UI.enablePen();
      }
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
  document.querySelector('button[data-target="#starPopuo"]').addEventListener('click', function() {
    checkAndDisableDraw(true);
  });
  document.querySelector('button[data-dismiss="modal"]').addEventListener('click', function() {
    checkAndDisableDraw(false);
  });
}

// Search Handler
(function(document, window) {
  // global variable for search state
  let inputHolder = document.querySelector('.table-input');
  let currentIndex = 0;
  let searchMeta = [];
  let lastSearchString = null;

  function updateSearchCounterDisplay(noResult, page) {
    if (noResult) {
      document.getElementById('currentItemLabel').innerText = 0;
      document.getElementById('allItemLabel').innerText = 0;
    }
    else {
      document.getElementById('currentItemLabel').innerText = page;
      document.getElementById('allItemLabel').innerText = searchMeta.length;
    }
  }

  function findByTextContent(needle, haystack, precise=false) {
  // needle: String, the string to be found within the elements.
  // haystack: String, a selector to be passed to document.querySelectorAll(),
  //           NodeList, Array - to be iterated over within the function:
  // precise: Boolean, true - searches for that precise string, surrounded by
  //                          word-breaks,
  //                   false - searches for the string occurring anywhere
  var elems;

  // no haystack we quit here, to avoid having to search
  // the entire document:
  if (!haystack) {
    return false;
  }
  // if haystack is a string, we pass it to document.querySelectorAll(),
  // and turn the results into an Array:
  else if ('string' == typeof haystack) {
    elems = [].slice.call(document.querySelectorAll(haystack), 0);
  }
  // if haystack has a length property, we convert it to an Array
  // (if it's already an array, this is pointless, but not harmful):
  else if (haystack.length) {
    elems = [].slice.call(haystack, 0);
  }

  // work out whether we're looking at innerText (IE), or textContent
  // (in most other browsers)
  var textProp = 'textContent' in document ? 'textContent' : 'innerText',
    // creating a regex depending on whether we want a precise match, or not:
    reg  = new RegExp(needle, 'i'),
      // iterating over the elems array:
    found = elems.filter(function(el) {
      // returning the elements in which the text is, or includes,
      // the needle to be found:
      return reg.test(el[textProp]);
    });
  debugger;
  return found.length ? found : false;
}

  async function queryPdf(searchString, precise = false) {
    console.log('queryPDF called !!!!')
    toggleLoader(true)
    let searchStack = [];
    // creating a regex depending on whether we want a precise match, or not:
    let reg = new RegExp(searchString, "i");
    debugger;
    for (let i = 1; i <= NUM_PAGES; i++) {
      let pagePromise = await PDF_DOC.getPage(i);
      let pageText = await pagePromise.getTextContent({normalizeWhitespace: true})
      let result = await pageText.items.filter((el) => reg.test(el.str));
      if (result.length) {searchStack.push({page: i, count: result.length})}
    }
    lastSearchString = searchString;
    await searchStack.sort((a, b) => {return a.page - b.page;});
    toggleLoader(false)
    return searchStack
  }

  function checkString(queryString) {
    return !!queryString.trim();
  }

  async function findNextOccurance() {
    if (!checkString(inputHolder.value)) {
      searchMeta = [];
      updateSearchCounterDisplay(true, 0);
      return;
    }
    if (inputHolder.value.trim() !== lastSearchString) {
      searchMeta = await queryPdf(inputHolder.value.trim(), false)
      lastSearchString = inputHolder.value.trim();
    }
    currentIndex += 1;
    if (currentIndex > searchMeta.length) {currentIndex = 1}

    if (searchMeta.length) {
      try {
        if (searchMeta[currentIndex - 1]) {
          await render(searchMeta[currentIndex - 1].page);
          findByTextContent(inputHolder.value.trim(), 'span', false).forEach((el) => {
              let re = new RegExp(inputHolder.value.trim(), 'i');
              el.innerHTML = el.innerHTML.replace(re, `<span class="search-highlight">${inputHolder.value}</span>`);
          });
        }
        updateSearchCounterDisplay(false, currentIndex)
      } catch (e) {
        console.error('error  occured', e);
        console.log('Skipping the page number as no result found')
      }
      return;
    }
    updateSearchCounterDisplay(true, 0)
  }

  async function findPrevOccurance() {
    if (!checkString(inputHolder.value)) {
      searchMeta = [];
      updateSearchCounterDisplay(true, 0);
      return;
    }
    if (inputHolder.value.trim() !== lastSearchString) {
      searchMeta = await queryPdf(inputHolder.value.trim(), false)
      lastSearchString = inputHolder.value.trim();
    }
    currentIndex -= 1;
    if (currentIndex <= 0) {currentIndex = searchMeta.length}
    if (searchMeta.length) {
      try {
        if (searchMeta[currentIndex - 1]) {
          await render(searchMeta[currentIndex - 1].page);
          findByTextContent(inputHolder.value, 'span', false).forEach((el) => {
              let re = new RegExp(inputHolder.value.trim(), 'i');
              el.innerHTML = el.innerHTML.replace(re, `<span class="search-highlight">${inputHolder.value}</span>`);
          });
        }
        updateSearchCounterDisplay(!searchMeta.length || false, currentIndex)
      } catch (e) {
        console.log('Skipping the page number as no result found')
      }
      return;
    }
    updateSearchCounterDisplay(true, 0)
  }

  function resetSearch() {
    let search = document.querySelectorAll('.search-highlight')
    search.forEach((el) => {
      el.parentNode.innerHTML = el.parentNode.textContent
    });
  }

  document.querySelector('.close-search').addEventListener('click', function(e) {
    resetSearch();
    currentIndex = 0;
    inputHolder.value = '';
    lastSearchString = null;
    searchMeta = [];
    document.getElementById('currentItemLabel').innerText = '';
    document.getElementById('allItemLabel').innerText = '';
  });
  document.getElementById('searchNext').addEventListener('click', findNextOccurance);
  document.getElementById('searchPrev').addEventListener('click', findPrevOccurance);
})(document, window);

// scale rotate functions
function initScaleRotate() {
  let scaleEle = document.getElementById('scaleDropDown');
  scaleEle.textContent = RENDER_OPTIONS.scale * 100 + '%';

  function setScaleRotate(scale, rotate) {
    scale = parseFloat(scale, 10);
    rotate = parseInt(rotate, 10);

    if (RENDER_OPTIONS.scale !== scale || RENDER_OPTIONS.rotate !== rotate) {
      RENDER_OPTIONS.scale = scale;
      RENDER_OPTIONS.rotate = rotate;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/scale`, RENDER_OPTIONS.scale);
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/rotate`, RENDER_OPTIONS.rotate % 360);
      render(currentPage);
    }
  }

  function handleScaleChange(e) {
    let target = e.currentTarget;
    let scaleValue = target.getAttribute('data-value');
    if (parseFloat(scaleValue)) {
      if ((parseFloat(scaleValue) === 99)) {
        scaleValue = ACTUAL_SCALE;
      }
      setScaleRotate(parseFloat(scaleValue), RENDER_OPTIONS.rotate);
      document.getElementById('scaleDropDown').textContent = target.text;
    }
  }

  // javascript for dropdown
  document.getElementById('scaleDropDown').addEventListener('click', (event) => {
    document.getElementById('myDropdown').classList.toggle('show');
  });
  // Close the dropdown if the user clicks outside of it
  document.addEventListener('click', (event) => {
    if (!event.target.matches('.dropbtn')) {
      let dropdowns = document.getElementsByClassName('dropdown-content');
      let i;
      for (i = 0; i < dropdowns.length; i++) {
        let openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  });
  // javascript for dropdown end
  document.querySelectorAll('.scale-values').forEach((el) => {
    el.addEventListener('click', handleScaleChange);
  });
}

// attacg all key handlers
(function keyBinder() {
  // define all handler
  let nextButton = document.getElementById('next');
  let prevButton = document.getElementById('prev');

  function handleKeyPress(e) {
    console.log("Key pressed is ", e.keyCode)
    let key = e.keyCode || e.which;
    switch (key) {
      case 13:
        if (document.activeElement.tagName === 'INPUT') {
          let pageToGo = parseInt(e.target.value);
          if (pageToGo > 0 && pageToGo <= NUM_PAGES && typeof pageToGo === 'number') {
            currentPage = pageToGo;
            render(currentPage);
          }
          setPageNumber();
        }
        break;
      case 37:
        prevButton.click();
        break;
      case 39:
        nextButton.click();
        break;
    }
  }
  document.addEventListener('keyup', handleKeyPress);
})();
