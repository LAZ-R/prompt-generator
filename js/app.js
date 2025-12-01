import { APP_NAME, APP_VERSION } from "../app-properties.js";
import { getSvgIcon } from "./services/icons.service.js";
import { getUser, setStorage, setUser } from "./services/storage.service..js";
import { setHTMLTitle, logAppInfos } from "./utils/UTILS.js";
import { requestWakeLock } from "./utils/wakelock.js";

//import { deleteStorage, getStorageDom, getUser, setStorage, setUser } from "./services/storage.service..js";

// VARIABLES //////////////////////////////////////////////////////////////////////////////////////

const MAIN = document.getElementById('main');
const SLIDE_PANEL = document.getElementById('slidePanel');
const CATEGORIES_CONTAINER = document.getElementById('categoriesContainer');

let currentCreationCategoryName = '';
let currentCreationObj = {
	id: 0,
	title: '',
	description: '',
}

let currentEditionCategoryName = '';
let currentEditionObj = {
	id: 0,
	title: '',
	description: '',
}

let currentDeleteCategoryName = '';
let currentDeleteObj = {
	id: 0,
	title: '',
	description: '',
}

// FONCTIONS //////////////////////////////////////////////////////////////////////////////////////

// Homepage ###################################################################

// DOM ---------------------------

function getCategorySelect(category) {
  let user = getUser();
  let valueId = null;

  function getSelectedValueIdForCategory(category) {
    switch (category.name) {
      case 'Base':
        valueId = user.CURRENTLY_SELECTED_VALUE_ID_BASE;
        break;
      case 'Subject':
        valueId = user.CURRENTLY_SELECTED_VALUE_ID_SUBJECT;
        break;
      case 'Action':
        valueId = user.CURRENTLY_SELECTED_VALUE_ID_ACTION;
        break;
      case 'Context':
        valueId = user.CURRENTLY_SELECTED_VALUE_ID_CONTEXT;
        break;
      default:
        break;
    }
    return valueId;
  }

  let str = `<select id="select${category.name}" class="lzr-select lzr-solid" onchange="onSelectChange(event, '${category.name}')">`;
  for (let value of category.values) {
    str += `<option value="${value.id}" ${getSelectedValueIdForCategory(category) == value.id ? 'selected' : ''}>${value.title}</option>`;
  }
  str += '</select>';
  return str;
}

function getCategoryDom(category) {
  let str = `
    <div class="category">
      <span class="category-title">${category.name}</span>
      <div class="category-bottom">
        ${getCategorySelect(category)}
        <div class="category-buttons">
          <button class="lzr-button lzr-square lzr-solid lzr-info" onclick="onEditCategoryClick('${category.name}')">${getSvgIcon('edit')}</button>
          <button class="lzr-button lzr-square lzr-solid lzr-info" onclick="onNewValueClick('${category.name}')">${getSvgIcon('plus')}</button>
        </div>
      </div>
    </div>
  `;
  return str;
}

function getCategoriesDom() {
  let user = getUser();

  let str = ``;
  for (let category of user.CATEGORIES) {
    str += getCategoryDom(category);
  }
  return str;
}

function setCategoriesDom() {
  CATEGORIES_CONTAINER.innerHTML = getCategoriesDom();
}

function setTextArea() {
  let user = getUser();

  let SELECT_BASE = document.getElementById('selectBase');
  let valueBase = user.CATEGORIES.find((category) => category.name == 'Base').values.find((value) => value.id == SELECT_BASE.value);

  let SELECT_SUBJECT = document.getElementById('selectSubject');
  let valueSubject = user.CATEGORIES.find((category) => category.name == 'Subject').values.find((value) => value.id == SELECT_SUBJECT.value);

  let SELECT_ACTION = document.getElementById('selectAction');
  let valueAction = user.CATEGORIES.find((category) => category.name == 'Action').values.find((value) => value.id == SELECT_ACTION.value);

  let SELECT_CONTEXT = document.getElementById('selectContext');
  let valueContext = user.CATEGORIES.find((category) => category.name == 'Context').values.find((value) => value.id == SELECT_CONTEXT.value);

  let textAreaString = `${valueBase !== undefined ? `${valueBase.description}.\n\n` : ''}${valueSubject !== undefined ?`${valueSubject.description}.\n\n`  : ''}${valueAction !== undefined ? `${valueAction.description}.\n\n` : ''}${valueContext !== undefined ? `${valueContext.description}.\n` : ''}`;

  document.getElementById('mainTextarea').value = textAreaString;
}

// OnChange ---------------------------

function onSelectChange(event, categoryName) {
  let user = getUser();
  switch (categoryName) {
    case 'Base':
      user.CURRENTLY_SELECTED_VALUE_ID_BASE = event.target.value;
      break;
    case 'Subject':
      user.CURRENTLY_SELECTED_VALUE_ID_SUBJECT = event.target.value;
      break;
    case 'Action':
      user.CURRENTLY_SELECTED_VALUE_ID_ACTION = event.target.value;
      break;
    case 'Context':
      user.CURRENTLY_SELECTED_VALUE_ID_CONTEXT = event.target.value;
      break;
    default:
      break;
  }
  setUser(user);
  setCategoriesDom();
  setTextArea();
}
window.onSelectChange = onSelectChange;

function onCopyClick() {
  const TEXT = document.getElementById('mainTextarea').value;
  navigator.clipboard.writeText(TEXT);
}
window.onCopyClick = onCopyClick;


// Slide panel ###################################################################

function onCloseSlidePanelClick() {
  SLIDE_PANEL.classList.add('hidden');
}
window.onCloseSlidePanelClick = onCloseSlidePanelClick;

// OnChange ---------------------------

function onTitleChange(event, mode) {
  console.log(event.target.value);
  switch (mode) {
    case 'creation':
      currentCreationObj.title = event.target.value;
      break;
  case 'edition':
      currentEditionObj.title = event.target.value;
      break;
    default:
      break;
  }
}
window.onTitleChange = onTitleChange;

function onDescChange(event, mode) {
  console.log(event.target.value);
  switch (mode) {
    case 'creation':
      currentCreationObj.description = event.target.value;
      break;
  case 'edition':
      currentEditionObj.description = event.target.value;
      break;
    default:
      break;
  }
}
window.onDescChange = onDescChange;

// NEW VALUE ==============================================

function onNewValueClick(categoryName) {
  currentCreationCategoryName = '';
  currentCreationObj = {
    id: 0,
    title: '',
    description: '',
  }
  let user = getUser();
  let category = user.CATEGORIES.find((category) => category.name == categoryName);
  currentCreationCategoryName = category.name;
  let lastId = 0;
  for (let value of category.values) {
    if (value.id > lastId) {
      lastId = value.id;
    }
  }
  currentCreationObj.id = lastId + 1;

  SLIDE_PANEL.innerHTML = `
    <div class="slide-header">
      <h1>New ${category.name}</h1>
      <button class="lzr-button lzr-square lzr-outlined" onclick="onCloseSlidePanelClick()">${getSvgIcon('xmark')}</button>
    </div>
    <label>Title</label>
    <input type="text" oninput="onTitleChange(event, 'creation')"/>
    <hr>
    <label>Description</label>
    <textarea oninput="onDescChange(event, 'creation')"></textarea>
    <hr>
    <button class="lzr-button lzr-solid lzr-success" onclick="onCreateValueClick()" style="width: 100%;">Create</button>
  `;
  SLIDE_PANEL.classList.remove('hidden');
}
window.onNewValueClick = onNewValueClick;

function onCreateValueClick() {
  let user = getUser();
  let category = user.CATEGORIES.find((category) => category.name == currentCreationCategoryName);
  category.values.push(currentCreationObj);
  switch (category.name) {
    case 'Base':
      user.CURRENTLY_SELECTED_VALUE_ID_BASE = currentCreationObj.id;
      break;
    case 'Subject':
      user.CURRENTLY_SELECTED_VALUE_ID_SUBJECT = currentCreationObj.id;
      break;
    case 'Action':
      user.CURRENTLY_SELECTED_VALUE_ID_ACTION = currentCreationObj.id;
      break;
    case 'Context':
      user.CURRENTLY_SELECTED_VALUE_ID_CONTEXT = currentCreationObj.id;
      break;
    default:
      break;
  }
  setUser(user);

  setCategoriesDom();
  setTextArea();
  SLIDE_PANEL.classList.add('hidden');
}
window.onCreateValueClick = onCreateValueClick;

// EDIT VALUE =============================================

function onEditCategoryClick(categoryName) {
  console.log(categoryName)
  let user = getUser();
  let category = user.CATEGORIES.find((category) => category.name == categoryName);
  console.log(category)

  function getCategoryValuesDom(category) {
    let str = `<div class="values-list">`;
    for (let value of category.values) {
      str += `
      <div class="value-bloc">
        <span class="value-title">${value.title}</span>
        <div class="edit-buttons">
          <button class="lzr-button lzr-square lzr-solid lzr-info" onclick="onEditValueClick('${category.name}', '${value.id}')">${getSvgIcon('edit')}</button>
          <button class="lzr-button lzr-square lzr-solid lzr-error" onclick="onDeleteValueClick('${category.name}', '${value.id}')">${getSvgIcon('trash')}</button>
        </div>
      </div>
      `;
    }
    str += `</div>`;
    return str;
  }

  SLIDE_PANEL.innerHTML = `
    <div class="slide-header">
      <h1>Edit ${category.name}</h1>
      <button class="lzr-button lzr-square lzr-outlined" onclick="onCloseSlidePanelClick()">${getSvgIcon('xmark')}</button>
    </div>
    <div class="slide-body">
      ${getCategoryValuesDom(category)}
    </div>
  `;
  SLIDE_PANEL.classList.remove('hidden');
}
window.onEditCategoryClick = onEditCategoryClick;

function onEditValueClick(categoryName, valueId) {
  console.log(valueId)
  currentEditionCategoryName = categoryName;

  let user = getUser();
  let category = user.CATEGORIES.find((category) => category.name == categoryName);
  console.log(category);
  let value = category.values.find((value) => value.id == valueId);
  currentEditionObj = {
    id: Number(valueId),
    title: value.title,
    description: value.description,
  }

  SLIDE_PANEL.innerHTML = `
    <div class="slide-header">
      <h1>Edit ${currentEditionObj.title}</h1>
      <button class="lzr-button lzr-square lzr-outlined" onclick="onCloseSlidePanelClick()">${getSvgIcon('xmark')}</button>
    </div>
    <div class="slide-body">
    </div>
    <label>Title</label>
    <input type="text" oninput="onTitleChange(event, 'edition')" value="${value.title}"/>
    <hr>
    <label>Description</label>
    <textarea oninput="onDescChange(event, 'edition')">${value.description}</textarea>
    <hr>
    <button class="lzr-button lzr-solid lzr-success" onclick="onSaveValueClick()" style="width: 100%;">Save</button>
  `;
  SLIDE_PANEL.classList.remove('hidden');
}
window.onEditValueClick = onEditValueClick;

function onSaveValueClick() {
  let user = getUser();
  let category = user.CATEGORIES.find((category) => category.name == currentEditionCategoryName);
  console.log(category);
  console.log(currentEditionObj);
  let value = category.values.find((value) => value.id == currentEditionObj.id);
  console.log(value);

  value.title = currentEditionObj.title;
  value.description = currentEditionObj.description;
  switch (category.name) {
    case 'Base':
      user.CURRENTLY_SELECTED_VALUE_ID_BASE = currentEditionObj.id;
      break;
    case 'Subject':
      user.CURRENTLY_SELECTED_VALUE_ID_SUBJECT = currentEditionObj.id;
      break;
    case 'Action':
      user.CURRENTLY_SELECTED_VALUE_ID_ACTION = currentEditionObj.id;
      break;
    case 'Context':
      user.CURRENTLY_SELECTED_VALUE_ID_CONTEXT = currentEditionObj.id;
      break;
    default:
      break;
  }
  setUser(user);
  
  setCategoriesDom();
  setTextArea();
  SLIDE_PANEL.classList.add('hidden');
}
window.onSaveValueClick = onSaveValueClick;

// DELETE VALUE ===========================================

function onDeleteValueClick(categoryName, valueId) {
  currentDeleteCategoryName = categoryName;

  let user = getUser();
  let category = user.CATEGORIES.find((category) => category.name == categoryName);
  console.log(category);
  let value = category.values.find((value) => value.id == valueId);
  currentDeleteObj = {
    id: Number(valueId),
    title: value.title,
    description: value.description,
  }

  SLIDE_PANEL.innerHTML = `
    <div class="slide-header">
      <h1>Delete ${currentDeleteObj.title}</h1>
      <button class="lzr-button lzr-square lzr-outlined" onclick="onCloseSlidePanelClick()">${getSvgIcon('xmark')}</button>
    </div>
    <p>Are you sure you want to delete this value ?</p>
    
    <button class="lzr-button lzr-solid lzr-error" onclick="onConfirmDeleteValueClick()" style="width: 100%; margin-top: auto;">Delete</button>
  `;
  SLIDE_PANEL.classList.remove('hidden');
}
window.onDeleteValueClick = onDeleteValueClick;

function onConfirmDeleteValueClick() {
  let user = getUser();
  let category = user.CATEGORIES.find((category) => category.name == currentDeleteCategoryName);
  let value = category.values.find((value) => value.id == currentDeleteObj.id);

  switch (category.name) {
    case 'Base':
      if (user.CURRENTLY_SELECTED_VALUE_ID_BASE == currentDeleteObj.id) {
        user.CURRENTLY_SELECTED_VALUE_ID_BASE = null;
      }
      break;
    case 'Subject':
      if (user.CURRENTLY_SELECTED_VALUE_ID_SUBJECT == currentDeleteObj.id) {
        user.CURRENTLY_SELECTED_VALUE_ID_SUBJECT = null;
      }
      break;
    case 'Action':
      if (user.CURRENTLY_SELECTED_VALUE_ID_ACTION == currentDeleteObj.id) {
        user.CURRENTLY_SELECTED_VALUE_ID_ACTION = null;
      }
      break;
    case 'Context':
      if (user.CURRENTLY_SELECTED_VALUE_ID_CONTEXT == currentDeleteObj.id) {
        user.CURRENTLY_SELECTED_VALUE_ID_CONTEXT = null;
      }
      break;
    default:
      break;
  }
  category.values.splice(category.values.indexOf(value), 1);
  setUser(user);

  setCategoriesDom();
  setTextArea();
  SLIDE_PANEL.classList.add('hidden');
}
window.onConfirmDeleteValueClick = onConfirmDeleteValueClick;

// INITIALIZATION /////////////////////////////////////////////////////////////////////////////////

logAppInfos(APP_NAME, APP_VERSION);
setHTMLTitle(APP_NAME);
setStorage();

// Setting user preferences
let user = getUser();
if (user.KEEP_SCREEN_AWAKE) {
  requestWakeLock();
}
document.getElementsByClassName('lzr')[0].style = `--theme: '${user.PREFERED_THEME}';`;

// EXECUTION //////////////////////////////////////////////////////////////////////////////////////

document.getElementById('copyButton').innerHTML = `${getSvgIcon('copy')} Copy to clipboard`;
setCategoriesDom();
setTextArea();
