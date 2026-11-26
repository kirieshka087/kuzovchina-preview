const services = [
  {part:'Бампер',name:'Покраска бампера',price:13000},
  {part:'Дверь',name:'Покраска двери',price:13000},
  {part:'Крыло',name:'Покраска крыла',price:13000},
  {part:'Капот',name:'Покраска капота',price:15000},
  {part:'Порог',name:'Покраска порога',price:10000},
  {part:'Порог',name:'Восстановление порога',price:6000,work:'restore'},
  {part:'Крыша',name:'Покраска крыши',price:20000}
];
const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const serviceGrid = document.querySelector('#service-grid');
services.forEach(service => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'service-card';
  const title = document.createElement('h3');
  title.textContent = service.name;
  const description = document.createElement('p');
  description.textContent = service.work ? 'Оценка состояния и восстановление' : 'Полное окрашивание элемента';
  const price = document.createElement('strong');
  price.textContent = 'от ' + money(service.price);
  button.append(title, description, price);
  button.addEventListener('click', () => {
    document.querySelector('input[name="part"][value="' + service.part + '"]').checked = true;
    document.querySelector('input[name="work"][value="' + (service.work || 'paint') + '"]').checked = true;
    updatePrice();
    document.querySelector('#calculator').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  serviceGrid.append(button);
});
const lastCard = document.createElement('a');
lastCard.className = 'service-card last';
lastCard.href = '#request';
lastCard.innerHTML = '<h3>Другая задача?</h3><p>Расскажите о повреждении.<br>Обсудим подходящий вариант.</p><span>Связаться с мастерской</span>';
serviceGrid.append(lastCard);
const parts = [...new Set(services.map(service => service.part))];
const chips = document.querySelector('#part-chips');
parts.forEach((part,index) => {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'radio'; input.name = 'part'; input.value = part; input.checked = index === 0;
  const span = document.createElement('span'); span.textContent = part;
  label.append(input,span); chips.append(label);
});
const serviceSelect = document.querySelector('#request-service');
services.forEach(service => serviceSelect.add(new Option(service.name,service.name)));
serviceSelect.add(new Option('Подготовка и полировка','Подготовка и полировка'));
serviceSelect.add(new Option('Другая задача','Другая задача'));
const calc = document.querySelector('#calc-form');
let selectedService = services[0].name;
function updatePrice(){
  const data = new FormData(calc);
  const part = data.get('part');
  const work = data.get('work');
  const service = services.find(item => item.part === part && (item.work || 'paint') === work);
  selectedService = service ? service.name : (work === 'prep' ? 'Подготовка и полировка' : 'Другая задача');
  document.querySelector('#calc-price').textContent = service ? 'от ' + money(service.price) : 'После осмотра';
  document.querySelector('#calc-note').textContent = service ? 'Окончательная цена зависит от состояния детали и объёма работ.' : 'Для этой работы стоимость определим индивидуально. Обсудите задачу с мастерской.';
}
calc.addEventListener('change',updatePrice);
calc.addEventListener('submit',event => {
  event.preventDefault();
  serviceSelect.value = selectedService;
  document.querySelector('#request').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded',String(open));
  document.querySelector('#nav').classList.toggle('open',open);
});
document.querySelectorAll('#nav a').forEach(link => link.addEventListener('click', () => {
  menu.setAttribute('aria-expanded','false');
  document.querySelector('#nav').classList.remove('open');
}));
const photos = document.querySelector('input[name="photos"]');
photos.addEventListener('change', () => {
  const files = Array.from(photos.files);
  const valid = files.length <= 5 && files.every(file => ['image/jpeg','image/png','image/webp'].includes(file.type) && file.size <= 10 * 1024 * 1024);
  photos.setCustomValidity(valid ? '' : 'Выберите до 5 фотографий JPG, PNG или WebP, каждая до 10 МБ.');
  document.querySelector('#file-note').textContent = valid && files.length ? files.map(file => file.name).join(', ') + '. Прикрепите эти файлы в Telegram.' : 'До 5 файлов JPG, PNG, WebP, каждая до 10 МБ. Фотографии добавите в Telegram перед отправкой.';
  if (!valid) photos.reportValidity();
});
const dialog = document.querySelector('#request-dialog');
document.querySelector('#request-form').addEventListener('submit',event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const lines = ['Здравствуйте! Хочу обсудить кузовные работы.', '', 'Имя — ' + data.get('name').trim(), 'Телефон — ' + data.get('phone').trim(), 'Автомобиль — ' + data.get('car').trim(), 'Работы — ' + data.get('service')];
  if (data.get('comment').trim()) lines.push('Комментарий — ' + data.get('comment').trim());
  if (photos.files.length) lines.push('Фотографии — ' + Array.from(photos.files).map(file => file.name).join(', '));
  document.querySelector('#message-preview').value = lines.join('\n');
  document.querySelector('#copy-status').textContent = '';
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#copy-message').addEventListener('click', async () => {
  const preview = document.querySelector('#message-preview');
  try {
    await navigator.clipboard.writeText(preview.value);
    document.querySelector('#copy-status').textContent = 'Текст скопирован. Теперь откройте Telegram.';
  } catch {
    preview.focus(); preview.select();
    document.querySelector('#copy-status').textContent = 'Текст выделен. Скопируйте его вручную.';
  }
});
updatePrice();
