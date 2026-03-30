// Carousel functionality
class Carousel {
	constructor() {
		this.currentSlide = 0;
		this.slides = document.querySelectorAll('.carousel-slide');
		this.indicators = document.querySelectorAll('.indicator');
		this.interval = null;
		this.slideDuration = 5000; // 5 seconds per slide
		
		this.init();
	}
	
	init() {
		// Set up indicator clicks
		this.indicators.forEach((indicator, index) => {
			indicator.addEventListener('click', () => {
				this.goToSlide(index);
			});
		});
		
		// Start auto-play
		this.startAutoPlay();
		
		// Pause on hover
		const carouselContainer = document.querySelector('.carousel-container');
		carouselContainer.addEventListener('mouseenter', () => {
			this.stopAutoPlay();
		});
		
		carouselContainer.addEventListener('mouseleave', () => {
			this.startAutoPlay();
		});
	}
	
	goToSlide(index) {
		// Remove active class from current slide and indicator
		this.slides[this.currentSlide].classList.remove('active');
		this.indicators[this.currentSlide].classList.remove('active');
		
		// Update current slide
		this.currentSlide = index;
		
		// Add active class to new slide and indicator
		this.slides[this.currentSlide].classList.add('active');
		this.indicators[this.currentSlide].classList.add('active');
		
		// Handle video playback
		this.handleVideoPlayback();
	}
	
	nextSlide() {
		const nextIndex = (this.currentSlide + 1) % this.slides.length;
		this.goToSlide(nextIndex);
	}
	
	startAutoPlay() {
		this.stopAutoPlay();
		this.interval = setInterval(() => {
			this.nextSlide();
		}, this.slideDuration);
	}
	
	stopAutoPlay() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}
	
	handleVideoPlayback() {
		// Pause all videos
		const allVideos = document.querySelectorAll('.carousel-video');
		allVideos.forEach(video => {
			video.pause();
		});
		
		// Play video if current slide contains one
		const currentSlide = this.slides[this.currentSlide];
		const video = currentSlide.querySelector('.carousel-video');
		if (video) {
			video.currentTime = 0;
			video.play().catch(e => {
				console.log('Video autoplay prevented:', e);
			});
		}
	}
}

// Simulate scale data updates
class ScaleDisplay {
	constructor() {
		this.tareElement = document.querySelector('.tare-value');
		this.weightElement = document.querySelector('.weight-value');
		this.priceElement = document.querySelector('.price-value');
		this.totalElement = document.querySelector('.total-value');
		this.productNameContainer = document.querySelector('.product-name');
		this.product1Element = document.querySelector('.product-name-primary');
		this.product2Element = document.querySelector('.product-name-secondary');
		
		this.isWeighing = false;
		this.tareWeight = 0.000;
		
		// Demo data - in real application, this would come from scale hardware
		// Mix of single name and double name examples for demonstration
		// Double name: Product Name + Category
		this.demoData = [
			{ weight: 1.250, tare: 0.050, unitPrice: 12.80, product1: 'FRESH TOMATO', product2: 'cà chua' },
			{ weight: 0.850, tare: 0.020, unitPrice: 18.50, product1: 'BANANA' },
			{ weight: 2.100, tare: 0.030, unitPrice: 9.90, product1: 'BANANA', product2: '香蕉' },
			{ weight: 0.500, tare: 0.010, unitPrice: 25.00, product1: 'STRAWBERRIE' },
			{ weight: 1.800, tare: 0.040, unitPrice: 15.60, product1: 'APPLE', product2: '富士苹果' },
			{ weight: 0.750, tare: 0.015, unitPrice: 22.00, product1: 'ORANGE' }
		];
		
		this.currentDemoIndex = 0;
		this.demoInterval = null;
	}
	
	// Show default state when no weighing
	showDefaultState() {
		this.isWeighing = false;
		
		// Show tare weight and zero weight
		if (this.tareElement) {
			this.tareElement.textContent = this.tareWeight.toFixed(3);
		}
		if (this.weightElement) {
			this.weightElement.textContent = '0.000';
		}
		
		// Show dash for prices when no product
		if (this.priceElement) {
			this.priceElement.textContent = '--';
		}
		if (this.totalElement) {
			this.totalElement.textContent = '--';
		}
		
		// Show default product names
		if (this.productNameContainer) {
			this.productNameContainer.classList.remove('hidden');
			this.productNameContainer.classList.add('single-line');
		}
		if (this.product1Element) {
			this.product1Element.textContent = 'PLEASE PLACE ITEM';
		}
		if (this.product2Element) {
			this.product2Element.classList.add('hidden');
		}
	}
	
	// Update display with weighing data
	updateDisplay(data) {
		if (!data || data.weight === undefined || data.weight === null || data.weight <= 0) {
			this.showDefaultState();
			return;
		}
		
		this.isWeighing = true;
		
		const weight = parseFloat(data.weight) || 0;
		const tare = parseFloat(data.tare) || 0;
		const unitPrice = parseFloat(data.unitPrice) || 0;
		const totalPrice = (weight * unitPrice).toFixed(2);
		
		// Update tare weight
		if (this.tareElement) {
			this.tareElement.textContent = tare.toFixed(3);
		}
		
		// Update weight
		if (this.weightElement) {
			this.weightElement.textContent = weight.toFixed(3);
		}
		
		// Update prices
		if (this.priceElement) {
			this.priceElement.textContent = '' + unitPrice.toFixed(2);
		}
		if (this.totalElement) {
			this.totalElement.textContent = '' + totalPrice;
		}
		
		// Update product names
		if (this.productNameContainer) {
			this.productNameContainer.classList.remove('hidden');
		}
		
		if (this.product1Element) {
			if (data.product1) {
				this.product1Element.textContent = data.product1;
			} else {
				this.product1Element.textContent = '';
			}
		}
		
		if (this.product2Element) {
			if (data.product2) {
				this.product2Element.textContent = data.product2;
				this.product2Element.classList.remove('hidden');
				// Remove single-line class when has second name
				if (this.productNameContainer) {
					this.productNameContainer.classList.remove('single-line');
				}
			} else {
				this.product2Element.classList.add('hidden');
				// Add single-line class when only has first name
				if (this.productNameContainer) {
					this.productNameContainer.classList.add('single-line');
				}
			}
		}
	}
	
	// Set tare weight
	setTareWeight(tare) {
		this.tareWeight = parseFloat(tare) || 0;
		if (this.tareElement && !this.isWeighing) {
			this.tareElement.textContent = this.tareWeight.toFixed(3);
		}
	}
	
	startDemo() {
		// Start with default state
		this.showDefaultState();
		
		// Simulate weighing cycle: default -> weighing -> default
		let cycleStep = 0; // 0: default, 1: weighing
		
		this.demoInterval = setInterval(() => {
			if (cycleStep === 0) {
				// Show weighing data
				this.updateDisplay(this.demoData[this.currentDemoIndex]);
				cycleStep = 1;
			} else {
				// Show default state
				this.showDefaultState();
				cycleStep = 0;
				// Move to next demo data
				this.currentDemoIndex = (this.currentDemoIndex + 1) % this.demoData.length;
			}
		}, 6000); // 6 seconds per step
	}
	
	stopDemo() {
		if (this.demoInterval) {
			clearInterval(this.demoInterval);
			this.demoInterval = null;
		}
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	// Initialize carousel
	const carousel = new Carousel();
	
	// Initialize scale display
	const scaleDisplay = new ScaleDisplay();
	
	// Start demo (shows default state first, then cycles through weighing data)
	scaleDisplay.startDemo();
	
	// Export scaleDisplay to window for external API access
	// In real application, you can call:
	// window.scaleDisplay.updateDisplay({weight: 1.250, tare: 0.050, unitPrice: 12.80, product1: 'PRODUCT', product2: 'CATEGORY'});
	// window.scaleDisplay.showDefaultState(); // to show default state
	// window.scaleDisplay.setTareWeight(0.050); // to set tare weight
	window.scaleDisplay = scaleDisplay;
	
	// Update store name (can be customized)
	const storeNameElement = document.querySelector('.store-name');
	if (storeNameElement) {
		// Store name can be updated here or via API
		// storeNameElement.textContent = 'YOUR STORE NAME';
	}
});
