/*jslint
    es6
*/

/////////////////////// Register the service worker
if ('serviceWorker' in navigator) {
	// Wait for the 'load' event to not block other work
	window.addEventListener('load', async () => {
		// Try to register the service worker.
		try {
			const reg = await navigator.serviceWorker.register('./sw.js');
			//console.log('Service worker registered! 😎', reg);
		} catch (err) {
			//console.log('😥 Service worker registration failed: ', err);
		}
	});
}

let data;
const body = document.getElementsByTagName("body")[0];
const header = document.createElement("header");
const main = document.createElement("main");
const footer = document.createElement("footer");
const screenRotate = document.createElement("div");
screenRotate.setAttribute('id', 'screenRotate');
screenRotate.textContent = "Please rotate your screen for a better experience"
body.append(screenRotate, header, main, footer);

retrieveData();

/////////////////////// Retreive Data from JSON
async function retrieveData() {
	try {
		const response = await fetch('./data.json');
		if (!response.ok) {
			throw new Error(`Failed to fetch data: ${response.status}`);
		}
		const jsonData = await response.json();
		data = jsonData;
		generateHtml();
		getRandom();
	} catch (error) {
		console.error('Error fetching JSON:', error);
	}
}

/////////////////////// Generate html structure
function generateHtml() {
	const logoContainer = document.createElement("div");
	const logo = document.createElement("div");
	logoContainer.setAttribute('id', 'logoContainer');
	logo.setAttribute('id', 'logo');
	logo.style.background = "url(./media/icon/" + loadingImages[0] + ".svg) center center / contain no-repeat";
	header.append(logoContainer);
	logoContainer.append(logo, title);

	const toggle = document.createElement("div");
	const random = document.createElement("div");
	toggle.setAttribute('id', 'switch');
	random.setAttribute('id', 'random');
	//random.textContent = "Un autre ?";

	toggle.append(random);
	footer.appendChild(toggle);
	random.addEventListener("click", getRandom);
}

/////////////////////// Loading
function toggleLoading(state) {
	loading.style.display = state ? "flex" : "none";
}

/////////////////////// Generate Random
function getRandom() {
	toggleLoading(true);
	main.innerHTML = '';

	shuffleArray(data);
	const {
		Name,
		Move,
		Diet,
		Vertebrate,
		SoundName,
		SoundUrl,
		ImgUrls
	} = data[0];
	generateCarousel(Name, Move, Diet, Vertebrate, SoundName, SoundUrl, ImgUrls);

	toggleLoading(false);
}

/////////////////////// Carrousel generator
function createElement(tag, classes = [], attributes = {}, innerHTML = '') {
	const el = document.createElement(tag);
	classes.forEach(className => el.classList.add(className));
	Object.keys(attributes).forEach(attr => el.setAttribute(attr, attributes[attr]));
	el.innerHTML = innerHTML;
	return el;
}

function generateCarousel(dName, dMove, dDiet, dVertebrate, dSoundName, dSoundUrl, dImgUrls) {
	function createIcon(type, iconName, dataSpeak, parentElement) {
		const icon = createElement('div', [removeAccents(type)], {
			'data-speak': dataSpeak
		});

		icon.addEventListener('click', () => readOutName(dataSpeak));
		parentElement.appendChild(icon);
	}

	function createCarouselSlide(url) {
		const figure = createElement('figure');
		const image = createElement('img', [], {
			'src': `./media/animals/${url}`,
			'loading': "lazy"
		});

		const dots = createElement('span', ["dots"]);
		figure.appendChild(image);
		return {
			figure,
			dots
		};
	}

	const description = createElement('div', ['description']);
	const name = createElement('span', ['name'], {}, dName);

	name.addEventListener('click', () => readOutName(dName));

	const iconContainer = createElement('div');
	iconContainer.appendChild(name);

	if (dSoundUrl) {
		const sound = createElement('div', ['sound'], {
			'data-speak': dSoundName
		});
		sound.addEventListener('click', () => playAnimalSound(dSoundUrl));
		iconContainer.appendChild(sound);
	}

	const types = [...dMove, dDiet, dVertebrate];
	types.forEach(value => value && createIcon(value, value, value, iconContainer));

	description.append(iconContainer);

	const carousel = createElement('div', ['carousel']);
	const dotsContainer = createElement('div', ['dotsContainer']);

	if (dImgUrls) {
		dImgUrls.forEach((url) => {
			const {
				figure,
				dots
			} = createCarouselSlide(url);
			carousel.appendChild(figure);
			dotsContainer.appendChild(dots);
		});
	}

	main.append(carousel, dotsContainer, description);

	let currentIndex = 0;

	function updateCarousel() {
		carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
		const dots = dotsContainer.querySelectorAll('.dots');
		dots.forEach(dot => dot.classList.remove('active'));
		dots[currentIndex]?.classList.add('active');
	}

	function prevSlide() {
		currentIndex = (currentIndex > 0) ? currentIndex - 1 : carousel.children.length - 1;
		updateCarousel();
	}

	function nextSlide() {
		currentIndex = (currentIndex < carousel.children.length - 1) ? currentIndex + 1 : 0;
		updateCarousel();
	}

	let xDown = null;
	carousel.addEventListener("touchstart", (e) => {
		xDown = e.touches[0].clientX;
	}, false);

	carousel.addEventListener("touchmove", (e) => {
		if (!xDown) return;
		const xUp = e.touches[0].clientX;
		const xDiff = xDown - xUp;
		xDiff > 0 ? nextSlide() : prevSlide();
		xDown = null;
	}, false);

	const firstDot = dotsContainer.querySelector('.dots:first-child');
	firstDot.classList.add('active');
}

/////////////////////// Text to speech
//'speechSynthesis' in window ? console.log("Web Speech API supported!") : console.log("Web Speech API not supported :-(")
//'speechSynthesis' in window ? alert('Web Speech API supported!') : alert("Web Speech API not supported :-(")

const synth = window.speechSynthesis;
const voices = synth.getVoices();
let msg = new SpeechSynthesisUtterance();
msg.voice = voices[3];
//msg.voice = voices.length > 3 ? voices[3] : voices[0];
msg.lang = 'fr-FR';

function readOutName(animalName) {
	msg.text = animalName;
	synth.speak(msg);
}

/////////////////////// Remove accents + spaces in URLs
function removeAccents(str) {
	if (typeof str === 'string') {
		return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/'/g, "-").toLowerCase();
	}
	return str;
}

/////////////////////// Play animal sounds
const audio = new Audio();
const animalSound = document.querySelectorAll(".sound");
let currentAudio = null;
audio.autoplay = false;
audio.loop = false;
audio.play().catch(error => {
	console.error('Error playing audio:', error);
});

function playAnimalSound(soundName) {
	if (currentAudio !== soundName) {
		audio.src = './media/sounds/' + soundName;
		audio.play();
		currentAudio = soundName;
	} else {
		audio.pause();
		currentAudio = null;
	}
	audio.onended = () => {
		currentAudio = null;
	};
}
