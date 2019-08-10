let prices = [500];
let history = [-1, -1, 1, 1];
let reverse_rate = 0.3;
let volatility = 3;

let ui_switch = 0;

window.onload = () => resizeDiv();
function resizeDiv() {

  let body = document.body;
  let html = document.documentElement;

  let height = Math.max( body.scrollHeight, body.offsetHeight,
                         html.clientHeight, html.scrollHeight, html.offsetHeight );
  let divHeight = height - 400;
  document.getElementById('content').style.height = `${divHeight}px`;

}

let user = {};
async function get_current_user() {

  const response = await fetch(`/get_user`);
  const json = await response.json();
  user = json;

  if(Object.keys(user).length == 0) {
    alert('You need to sign in first!');
    window.location.replace('/index.html');
  }

}
get_current_user();

function setup() {
  let cnv = createCanvas(window.innerWidth, 400);
  cnv.parent('sketch-holder');
}

window.addEventListener('resize', () => {
  resizeCanvas(window.innerWidth, 400);
  resizeDiv();
});

function draw() {

  background(255);
  let max_price = max(prices);
  let min_price = min(prices);

  let max_graph = max_price + (max_price - min_price) * 0.2;
  let min_graph = min_price - (max_price - min_price) * 0.2;

  if(prices[prices.length - 1] > prices[0]) stroke(48, 205, 154);
  else if(prices[prices.length - 1] < prices[0]) stroke(239, 77, 49);
  else stroke(204);

  strokeWeight(5);
  for(let i = 1; i < prices.length; i++) {

    let distance = width / prices.length;

    let x1 = i - 1;
    let y1 = prices[x1];
    let x2 = i;
    let y2 = prices[x2];

    let x1_norm = x1 * distance;
    let y1_norm = map(y1, min_graph, max_graph, height, 0);
    let x2_norm = x2 * distance;
    let y2_norm = map(y2, min_graph, max_graph, height, 0);

    line(x1_norm, y1_norm, x2_norm, y2_norm);

  }

  fill(255);
  textSize(48);
  stroke(0);
  strokeWeight(5);
  text(`OBucks Price: $${prices[prices.length - 1].toFixed(2)}`, 10, 50);
  if(ui_switch == 0 || ui_switch == 1) {
    text(`Portfolio value: ${(user.money + user.obucks * prices[prices.length - 1]).toFixed(2)}$`, 10, 385);
  } else if(ui_switch == 2 || ui_switch == 3) {
    text(`Money: $${user.money.toFixed(2)}`, 10, 385);
  } else {
    text(`Obucks: ${user.obucks}`, 10, 385);
  }

  if(mouseIsPressed) {

    stroke(0);
    let money = map(mouseY, height, 0, min_graph, max_graph);
    line(0, mouseY, width, mouseY);

    fill(255);
    textSize(32);
    strokeWeight(5);
    text(`${money.toFixed(2)}$`, 10, (mouseY - 10));

  }

  let afford = Math.floor(user.money / prices[prices.length - 1]);
  let buy_input = document.getElementById('buy_input');
  if(buy_input.value > afford) buy_input.value = afford;

  let sell_input = document.getElementById('sell_input');
  if(sell_input.value > user.obucks) sell_input.value = user.obucks;

}

async function buy() {

  let afford = Math.floor(user.money / prices[prices.length - 1]);
  let amount_str = document.getElementById('buy_input').value;
  if(amount_str == '') alert('Put the amount of OBucks you want to buy in the textfield under the buy button.');

  let amount = parseInt(amount_str);
  if(amount == 0) return;

  const response = await fetch(`/buy/${amount}/${prices[prices.length - 1]}`);
  const json = await response.json();

  if(json.success) alert(`You just bought ${amount} OBucks!`);
  else alert('Error!');
  get_current_user();

}

async function sell() {

  let amount_str = document.getElementById('sell_input').value;
  if(amount_str == '') {
    alert('Put the amount of OBucks you want to sell in the textfield under the sell button.');
    return;
  }
  let amount = parseInt(amount_str);
  if(amount == 0) return;

  const response = await fetch(`/sell/${amount}/${prices[prices.length - 1]}`);
  const json = await response.json();

  if(json.success) alert(`You just sold ${amount} OBucks!`);
  else alert('Error!');
  get_current_user();

}

function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

function calculateRSI() {

  let gains = [];
  let losses = [];
  for(let i = 0; i < history.length; i++) {
    if(history[i] > 0) gains.push(history[i]);
    else if(history[i] < 0) losses.push(abs(history[i]));
  }

  let gains_sum = gains.reduce((acc, val) => acc + val);
  let average_gain = gains_sum / history.length;

  let losses_sum = losses.reduce((acc, val) => acc + val);
  let average_loss = losses_sum / history.length;

  let rs = average_gain / average_loss;
  let rsi = 100 - 100 / (1 + rs);

  return rsi;

}

function reverseProb(value) {

  let downtrend = (5 / 3) * value;
  let uptrend = (5 / 3 - (5 / 3) * value);

  if(value <= 0.4) {
    return downtrend;
  } else if(value >= 0.6) {
    return uptrend;
  } else if(history[history.length - 1] > 0 && history[history.length - 2] > 0) {
    return uptrend;
  } else {
    return downtrend;
  }

}

function update() {

  if(history.length > 60) history.shift();
  if(prices.length > 300) prices.shift();

  if(prices[prices.length - 1] <= 0) {
    let prices = [500];
    let history = [-1, -1, 1, 1];
  }

  let rsi = calculateRSI();
  rsi = rsi / 100;

  let prob = reverseProb(rsi);
  let rand = randomNumber(0, 1);

  let histLen = history.length;
  let priceLen = prices.length;

  let trend_val = 0;
  if(rand < prob) trend_val = prob - rand;
  else {
    let rand2 = randomNumber(0, 1);
    if(rand2 < reverse_rate) trend_val = abs(history[histLen - 1]);
    else {
      trend_val = -abs(history[histLen - 1]) * (1 + randomNumber(0, 0.25));
    }
  }

  if(history[histLen - 1] > 0 && history[histLen - 2] > 0) {

    if(rsi >= 0.5) {
      history.push(trend_val);
      prices.push(prices[priceLen - 1] + trend_val * volatility);
    } else {
      let val = 1 - randomNumber(0, 1);
      history.push(val);
      prices.push(prices[priceLen - 1] + val * volatility);
    }

  } else if(history[histLen - 1] < 0 && history[histLen - 2] < 0) {

    if(rsi <= 0.5) {
      history.push(-trend_val);
      prices.push(prices[priceLen - 1] - trend_val * volatility);
    } else {
      let val = 1 - randomNumber(0, 1);
      history.push(-val);
      prices.push(prices[priceLen - 1] - val * volatility);
    }

  } else {
    let val = history[histLen - 1] * (1 + randomNumber(0, 1.5));
    history.push(val);
    prices.push(prices[priceLen - 1] + val);
  }

  if(ui_switch < 5) ui_switch++;
  else ui_switch = 0;

  let afford = Math.floor(user.money / prices[prices.length - 1]);
  let buy_input = document.getElementById('buy_input');
  buy_input.max = afford;
  if(buy_input.value > afford) buy_input.value = afford;

  let sell_input = document.getElementById('sell_input');
  sell_input.max = user.obucks;
  if(sell_input.value > user.obucks) sell_input.value = user.obucks;

}
setInterval(update, 1000);
