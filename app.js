import { services, integration, reviews } from './data.js';

const $ = selector => document.querySelector(selector);
const money = amount => amount === null ? 'Индивидуально' : new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
const servicePrice = service => (service.from ? 'от ' : '') + money(service.price);
const estimate = () => (selected().some(service => service.from) && total() !== null ? 'от ' : '') + money(total());
const quantities = new Map(services.map(service => [service.id,0]));
const controls = new Map();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const selected = () => services.filter(service => quantities.get(service.id) > 0);
const total = () => services.reduce((sum,service) => sum + quantities.get(service.id),0) > 1 ? null : services.reduce((sum,service) => sum + service.price * quantities.get(service.id),0);
let files = [];
let requestPending = false;

function element(tag,className,text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function scrollToSection(selector) {
  const target = $(selector);
  target.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
}

const calculatorDialog = $('#calculator-dialog');
function openCalculator() {
  closeMenu();
  if (calculatorDialog.open) return;
  calculatorDialog.showModal();
  calculatorDialog.scrollTop = 0;
  document.body.classList.add('calculator-open');
}
$('.calculator-close').addEventListener('click', () => calculatorDialog.close());
calculatorDialog.addEventListener('close', () => document.body.classList.remove('calculator-open'));
document.querySelectorAll('[data-open-calculator]').forEach(button => button.addEventListener('click',openCalculator));

function buildServiceCards() {
  services.forEach((service,index) => {
    const card = element('button','service-card reveal');
    card.type = 'button';
    card.setAttribute('aria-label',service.name + ', ' + servicePrice(service) + '. Добавить в расчёт');
    card.append(
      
      element('h3','',service.name),
      element('span','service-kind',service.kind),
      element('span','service-price',servicePrice(service)),
      element('span','service-direction','↗')
    );
    card.lastChild.setAttribute('aria-hidden','true');
    card.addEventListener('click', () => {
      quantities.set(service.id,Math.max(1,quantities.get(service.id)));
      updateCalculation();
      openCalculator();
      controls.get(service.id).plus.focus({preventScroll:true});
    });
    $('#services-grid').append(card);
  });
}

function buildCalculator() {
  services.forEach(service => {
    const row = element('div','calc-item');
    const description = element('div');
    description.append(element('h4','',service.name),element('span','unit-price',servicePrice(service) + (service.id === 'car' ? ' / автомобиль' : ' / деталь')));
    const counter = element('div','quantity-control');
    const minus = element('button','','−');
    const plus = element('button','','+');
    const output = element('output','','0');
    output.setAttribute('aria-label','Количество — ' + service.name);
    minus.type = plus.type = 'button';
    minus.setAttribute('aria-label','Уменьшить количество — ' + service.name);
    plus.setAttribute('aria-label','Увеличить количество — ' + service.name);
    minus.addEventListener('click', () => changeQuantity(service,-1));
    plus.addEventListener('click', () => changeQuantity(service,1));
    counter.append(minus,output,plus);
    row.append(description,counter);
    $('#calculator-items').append(row);
    controls.set(service.id,{row,minus,plus,output});
  });
}

function changeQuantity(service,delta) {
  quantities.set(service.id,Math.min(service.max,Math.max(0,quantities.get(service.id) + delta)));
  updateCalculation();
}

function updateCalculation() {
  services.forEach(service => {
    const {row,minus,plus,output} = controls.get(service.id);
    const quantity = quantities.get(service.id);
    output.textContent = quantity;
    minus.disabled = quantity === 0;
    plus.disabled = quantity === service.max;
    row.classList.toggle('has-quantity',quantity > 0);
  });
  const sum = total();
  const count = services.reduce((sum,service) => sum + quantities.get(service.id),0);
  const price = $('#total-price');
  price.textContent = estimate();
  price.classList.toggle('individual',sum === null);
  price.classList.remove('updated');
  if (!reducedMotion.matches) requestAnimationFrame(() => price.classList.add('updated'));
  $('#selection-count').textContent = count ? 'В расчёте — ' + count : 'Услуги не выбраны';
  $('#continue-request').disabled = count === 0;
  $('#reset-calculator').disabled = count === 0;
  const summary = $('#selected-services');
  summary.replaceChildren();
  if (!count) summary.textContent = 'Услуги ещё не выбраны. Можно отправить обращение без расчёта.';
  selected().forEach(service => {
    const row = element('div','summary-item');
    row.append(element('span','',service.name + ' × ' + quantities.get(service.id)),element('span','',quantities.get(service.id) > 1 ? 'Индивидуально' : servicePrice(service)));
    summary.append(row);
  });
  $('#form-total').textContent = estimate();
  $('#clear-form-calculation').hidden = count === 0;
}

$('#reset-calculator').addEventListener('click', () => {
  services.forEach(service => quantities.set(service.id,0));
  updateCalculation();
});
$('#clear-form-calculation').addEventListener('click', () => {
  services.forEach(service => quantities.set(service.id,0));
  updateCalculation();
});

$('#continue-request').addEventListener('click', () => {
  calculatorDialog.close();
  scrollToSection('#request-form');
  $('#customer-name').focus({preventScroll:true});
});

const topics = [
 ['Согласование','Дополнительные работы и расходы обсуждаем до их выполнения.'],
 ['Оценка по фото','Предварительно оценим повреждения по снимкам. Окончательная цена — после осмотра.'],
 ['Ремонт после ДТП','Выполняем кузовные, сварочные, подготовительные и малярные работы.']
];
topics.forEach(([title,text],index) => {
  const article = element('article','about-topic reveal');
  article.append(element('h3','',title),element('p','',text));
  $('#about-topics').append(article);
});

const steps = [
 ['Фото и обращение','Пришлите фотографии повреждений и расскажите об автомобиле.'],
 ['Осмотр и оценка','Дадим предварительный ориентир по фото. На осмотре определим полный объём ремонта.'],
 ['Согласование','Согласуем перечень работ, окончательную стоимость и сроки.'],
 ['Ремонт и покраска','Выполним кузовные, подготовительные и малярные работы. Проверим качество.'],
 ['Приёмка автомобиля','Вы осматриваете результат, принимаете автомобиль и оплачиваете работы.']
];
steps.forEach(([title,text],index) => {
  const li = element('li','process-step reveal');
  li.style.setProperty('--delay',index * 80 + 'ms');
  li.append(element('span','step-number',String(index + 1).padStart(2,'0')),element('h3','',title),element('p','',text));
  $('#process-list').append(li);
});

const questions = [
 ['Можно узнать стоимость по фотографии?','Да. Пришлите фотографии повреждений для предварительной оценки. Окончательная стоимость определяется после осмотра автомобиля.'],
 ['Сколько времени занимает покраска детали?','Предварительный ориентир — от 1 до 3 дней. Точный срок зависит от состояния детали и объёма подготовки, его согласуем после осмотра.'],
 ['Можно покрасить несколько элементов?','Да. Рассчитаем стоимость индивидуально с учётом количества элементов, повреждений, подготовки, цветоподбора и демонтажа.'],
 ['Работаете с автомобилями после серьёзных ДТП?','Да. Выполняем кузовной ремонт и восстановление геометрии кузова с использованием стапеля.'],
 ['Что может оплачиваться дополнительно?','Рихтовка, сварочные работы, устранение коррозии и дополнительные лакокрасочные материалы. Все дополнительные работы и расходы согласовываем до выполнения.'],
 ['Можно отремонтировать только бампер или дверь?','Да. Ремонтируем отдельные кузовные элементы, включая бамперы, двери, крылья, капот и пороги.'],
 ['Какая гарантия предоставляется?','Условия и сроки гарантии согласуем до начала работ. Уточните их при оценке вашего автомобиля.'],
 ['Как записаться?','Позвоните или напишите в Telegram. Через форму можно подготовить обращение для самостоятельной отправки в чат мастерской.']
];
questions.forEach(([question,answer],index) => {
  const item = element('div','faq-item');
  const button = element('button','faq-question');
  button.type = 'button';
  button.id = 'faq-question-' + index;
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-controls','faq-answer-' + index);
  button.append(element('span','technical',String(index + 1).padStart(2,'0')),element('span','',question),element('span','faq-plus'));
  button.lastChild.setAttribute('aria-hidden','true');
  const panel = element('div','faq-answer');
  panel.id = 'faq-answer-' + index;
  panel.setAttribute('role','region');
  panel.setAttribute('aria-labelledby',button.id);
  panel.setAttribute('aria-hidden','true');
  const inner = element('div');
  inner.append(element('p','',answer));
  panel.append(inner);
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded',String(open));
    panel.setAttribute('aria-hidden',String(!open));
    item.classList.toggle('open',open);
  });
  item.append(button,panel);
  $('#faq-list').append(item);
});

function buildReviewCards() {
  if (!reviews.length) return;
  $('#reviews-content').replaceChildren();
  reviews.forEach(review => {
    const article = element('article','review-card');
    if (review.demo) article.append(element('span','demo-label','Тестовый отзыв · вымышленный'));
    article.append(element('blockquote','',review.text),element('p','',review.name));
    $('#reviews-content').append(article);
  });
}
buildReviewCards();

const menuToggle = $('.menu-toggle');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded','false');
  $('.navigation').classList.remove('open');
  document.body.classList.remove('menu-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded',String(open));
  $('.navigation').classList.toggle('open',open);
  document.body.classList.toggle('menu-open',open);
});
$('.navigation').addEventListener('click',event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown',event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') { closeMenu(); menuToggle.focus(); }
  if (event.key !== 'Tab' || menuToggle.getAttribute('aria-expanded') !== 'true') return;
  const items = [...$('.navigation').querySelectorAll('a'),menuToggle];
  const index = items.indexOf(document.activeElement);
  if (event.shiftKey && index === 0) { event.preventDefault(); menuToggle.focus(); }
  else if (!event.shiftKey && document.activeElement === menuToggle) { event.preventDefault(); items[0].focus(); }
});
matchMedia('(min-width:801px)').addEventListener('change',event => { if (event.matches) closeMenu(); });

function renderFiles() {
  $('#file-list').replaceChildren();
  files.forEach((file,index) => {
    const li = element('li','file-entry');
    const remove = element('button','','Удалить');
    remove.type = 'button';
    remove.setAttribute('aria-label','Удалить файл ' + file.name);
    remove.addEventListener('click', () => {
      files.splice(index,1);
      renderFiles();
      $('#file-error').textContent = '';
    });
    li.append(element('span','',file.name + ' / ' + (file.size / 1024 / 1024).toFixed(1) + ' МБ'),remove);
    $('#file-list').append(li);
  });
}
$('#photo-input').addEventListener('change',event => {
  const incoming = Array.from(event.target.files);
  const messages = [];
  incoming.forEach(file => {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { messages.push(file.name + ' — нужен JPG, PNG или WebP.'); return; }
    if (file.size > 10 * 1024 * 1024) { messages.push(file.name + ' — больше 10 МБ.'); return; }
    if (files.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) return;
    if (files.length >= 5) { messages.push('Можно выбрать не больше 5 файлов.'); return; }
    files.push(file);
  });
  event.target.value = '';
  renderFiles();
  $('#file-error').textContent = [...new Set(messages)].join(' ');
});

function setError(name,message) {
  const input = $('#request-form').elements.namedItem(name);
  const error = $('#error-' + name);
  error.textContent = message;
  input.setAttribute('aria-invalid',String(Boolean(message)));
  input.setAttribute('aria-describedby',error.id);
}
['name','phone','vehicle','consent'].forEach(name => {
  const input = $('#request-form').elements.namedItem(name);
  input.addEventListener('input', () => setError(name,''));
});
function validateForm() {
  const form = $('#request-form');
  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.trim();
  const vehicle = form.elements.vehicle.value.trim();
  const digits = phone.replace(/\D/g,'');
  const errors = {
    name:name.length < 2 ? 'Укажите имя, минимум 2 символа.' : '',
    phone:digits.length < 10 || digits.length > 15 || !/^[+\d\s()-]+$/.test(phone) ? 'Укажите телефон — от 10 до 15 цифр.' : '',
    vehicle:vehicle.length < 2 ? 'Укажите марку и модель автомобиля.' : '',
    consent:!form.elements.consent.checked ? 'Подтвердите согласие на обработку данных.' : ''
  };
  Object.entries(errors).forEach(([name,message]) => setError(name,message));
  const first = Object.keys(errors).find(key => errors[key]);
  if (first) { form.elements.namedItem(first).focus(); return false; }
  return true;
}
function getRequestData() {
  const form = $('#request-form');
  return {
    name:form.elements.name.value.trim(),
    phone:form.elements.phone.value.trim(),
    vehicle:form.elements.vehicle.value.trim(),
    comment:form.elements.comment.value.trim(),
    services:selected().map(service => ({id:service.id,name:service.name,quantity:quantities.get(service.id),unitPrice:service.price})),
    preliminaryTotal:total(),
    customerType:form.elements.customerType.value,
    consent:form.elements.consent.checked
  };
}
function makeDraft(data) {
  const lines = ['Здравствуйте! Хочу обсудить покраску кузова.', '', 'Имя — ' + data.name, 'Телефон — ' + data.phone, 'Автомобиль — ' + data.vehicle, '', 'Работы'];
  if (!data.services.length) lines.push('Нужно обсудить с мастерской.');
  data.services.forEach(service => lines.push(service.name + ' × ' + service.quantity + ' — ' + (service.quantity > 1 ? 'Индивидуально' : servicePrice(services.find(item => item.id === service.id)))));
  if (data.services.length) lines.push('Базовый ориентир — ' + estimate());
  if (data.customerType === 'business') lines.push('Обращение от компании / автопарка');
  if (data.comment) lines.push('',data.comment);
  if (files.length) lines.push('Фотографии прикреплю в чате — ' + files.map(file => file.name).join(', '));
  return lines.join('\n');
}
$('#request-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (requestPending || !validateForm()) return;
  const data = getRequestData();
  const submit = $('#submit-request');
  const label = submit.querySelector('span');
  const status = $('#form-status');
  requestPending = true;
  submit.disabled = true;
  submit.querySelector('.button-spinner').hidden = false;
  label.textContent = integration.endpoint ? 'Отправляем…' : 'Готовим черновик…';
  status.textContent = '';
  try {
    if (!integration.endpoint) {
      $('#draft-text').value = makeDraft(data);
      $('#copy-feedback').textContent = '';
      $('#draft-dialog').showModal();
      status.textContent = 'Черновик готов. Заявка ещё не отправлена.';
      return;
    }
    const payload = new FormData();
    payload.append('request',JSON.stringify(data));
    files.forEach(file => payload.append('photos',file,file.name));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),20000);
    let response;
    try {
      response = await fetch(integration.endpoint,{method:'POST',body:payload,signal:controller.signal,credentials:'omit'});
    } finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error('server');
    const result = await response.json();
    if (result.success !== true) throw new Error('unconfirmed');
    status.textContent = 'Заявка отправлена. Мастерская свяжется с вами.';
    if (integration.metricaId && typeof window.ym === 'function') window.ym(integration.metricaId,'reachGoal','lead_submit_success');
  } catch (error) {
    status.textContent = error.name === 'AbortError' ? 'Ответ сервера не получен. Перед повторной отправкой уточните в мастерской, поступила ли заявка.' : 'Не удалось подтвердить отправку. Ваши данные сохранены в форме. Попробуйте ещё раз или напишите в Telegram.';
  } finally {
    requestPending = false;
    submit.disabled = false;
    submit.querySelector('.button-spinner').hidden = true;
    label.textContent = integration.endpoint ? 'Отправить заявку' : 'Подготовить заявку';
  }
});
if (integration.endpoint) {
  $('#submit-request>span').textContent = 'Отправить заявку';
  $('.form-intro>.note').textContent = 'Отправляя заявку, вы передаёте данные мастерской.';
}
document.querySelectorAll('.dialog').forEach(dialog => dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close()));
function openPrivacy() { $('#privacy-dialog').showModal(); }
$('#privacy-open').addEventListener('click',openPrivacy);
$('.privacy-trigger').addEventListener('click',openPrivacy);
$('#copy-draft').addEventListener('click',async () => {
  const draft = $('#draft-text');
  try {
    await navigator.clipboard.writeText(draft.value);
    $('#copy-feedback').textContent = 'Скопировано. Откройте Telegram и вставьте текст в чат.';
  } catch {
    draft.focus(); draft.select();
    $('#copy-feedback').textContent = 'Текст выделен. Скопируйте его вручную.';
  }
});

buildServiceCards();
buildCalculator();
updateCalculation();

function createHorizontalRail(rail,label) {
  rail.classList.add('horizontal-rail');
  rail.setAttribute('tabindex','0');
  rail.setAttribute('role','region');
  rail.setAttribute('aria-label',label);
  const toolbar = element('div','rail-toolbar');
  const hint = element('span','','Скролл влево–вправо');
  const move = direction => {
    const distance = rail.firstElementChild.getBoundingClientRect().width + 24;
    rail.scrollBy({left:direction * distance,behavior:reducedMotion.matches ? 'instant' : 'smooth'});
  };
  rail.addEventListener('keydown',event => {
    if (event.target !== rail || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  let origin = null;
  let dragging = false;
  let suppressClick = false;
  rail.addEventListener('pointerdown',event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    event.preventDefault();
    origin = {x:event.clientX,left:rail.scrollLeft,id:event.pointerId};
    dragging = false;
    suppressClick = false;
  });
  rail.addEventListener('pointermove',event => {
    if (!origin) return;
    const distance = event.clientX - origin.x;
    if (!dragging && Math.abs(distance) > 8) {
      dragging = true;
      rail.setPointerCapture(origin.id);
      rail.classList.add('dragging');
    }
    if (!dragging) return;
    event.preventDefault();
    rail.scrollLeft = origin.left - distance;
  });
  const stopDrag = () => {
    suppressClick = dragging;
    origin = null;
    dragging = false;
    rail.classList.remove('dragging');
  };
  rail.addEventListener('pointerup',stopDrag);
  rail.addEventListener('pointercancel',stopDrag);
  rail.addEventListener('pointerleave', () => { if (!dragging) origin = null; });
  rail.addEventListener('click',event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  },true);
  rail.addEventListener('dragstart',event => event.preventDefault());
  toolbar.append(hint);
  rail.after(toolbar);
}
createHorizontalRail($('#services-grid'),'Виды покраски и базовые цены');
createHorizontalRail($('#process-list'),'Этапы работы');
if (reviews.length) createHorizontalRail($('#reviews-content'),'Тестовые отзывы');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in-view');
    revealObserver.unobserve(entry.target);
  });
},{threshold:.08,rootMargin:'0px 0px -20px 0px'});
document.querySelectorAll('.reveal,.process-list').forEach(node => revealObserver.observe(node));
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const current = $('.navigation a.active');
    current?.classList.remove('active');
    current?.removeAttribute('aria-current');
    const link = document.querySelector('.navigation a[href="#' + entry.target.id + '"]');
    if (link) { link.classList.add('active'); link.setAttribute('aria-current','location'); }
  });
},{rootMargin:'-15% 0px -65% 0px'});
document.querySelectorAll('.section-observed').forEach(node => sectionObserver.observe(node));
const scrollTypography = [...document.querySelectorAll('.scroll-type')];
let scrollFrame = false;
function updateScrollUI() {
  $('.site-header').classList.toggle('compact',window.scrollY > 70);
  const range = document.documentElement.scrollHeight - window.innerHeight;
  $('.reading-progress').style.transform = 'scaleX(' + (range > 0 ? window.scrollY / range : 0) + ')';
  if (!reducedMotion.matches && window.innerWidth > 800) {
    scrollTypography.forEach(heading => {
      const bounds = heading.getBoundingClientRect();
      const progress = Math.max(-1,Math.min(1,(window.innerHeight * 0.55 - bounds.top) / window.innerHeight));
      heading.style.setProperty('--type-shift',progress * 28 + 'px');
    });
  } else {
    scrollTypography.forEach(heading => heading.style.setProperty('--type-shift','0px'));
  }
  scrollFrame = false;
}
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = true;
  requestAnimationFrame(updateScrollUI);
},{passive:true});
window.addEventListener('resize',updateScrollUI);
updateScrollUI();

$('#business-request').addEventListener('click', () => {
  $('#customer-type').value = 'business';
  scrollToSection('#request-form');
  $('#customer-name').focus({preventScroll:true});
});

const reportStages = [
 {image:'frame-1600.webp',alt:'Рабочая зона кузовного сервиса',title:'Осмотр и согласование',text:'Повреждения, перечень работ, стоимость и сроки. Согласуем всё перед ремонтом.'},
 {image:'preparation-1600.webp',alt:'Подготовленные кузовные детали',title:'Подготовка деталей',text:'Подготовительные работы с кузовными элементами перед нанесением покрытия.'},
 {image:'paint-1600.webp',alt:'Детали в покрасочной камере',title:'Покраска и проверка',text:'Покраска в камере и контроль качества перед приёмкой автомобиля.'}
];
const reportTabs = [...document.querySelectorAll('[data-report-stage]')];
function showReportStage(index) {
 const stage = reportStages[index];
 reportTabs.forEach((tab,i) => { tab.classList.toggle('active',i === index); tab.setAttribute('aria-selected',String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
 $('#report-photo').src = 'assets/' + stage.image;
 $('#report-photo').alt = stage.alt;
 $('#report-step-title').textContent = stage.title;
 $('#report-step-description').textContent = stage.text;
 $('#report-progress').textContent = String(index + 1).padStart(2,'0') + ' / 03';
 $('#report-panel').setAttribute('aria-labelledby','report-tab-' + index);
}
reportTabs.forEach((tab,index) => {
 tab.addEventListener('click', () => showReportStage(index));
 tab.addEventListener('keydown',event => {
  let next;
  if (['ArrowDown','ArrowRight'].includes(event.key)) next = (index + 1) % reportTabs.length;
  if (['ArrowUp','ArrowLeft'].includes(event.key)) next = (index + reportTabs.length - 1) % reportTabs.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = reportTabs.length - 1;
  if (next !== undefined) {event.preventDefault(); showReportStage(next); reportTabs[next].focus();}
 });
});
