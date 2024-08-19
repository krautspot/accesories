document.addEventListener('DOMContentLoaded', function () {
    const slider = document.getElementById('slider');
    const sliderImages = document.getElementById('slider-images');
    const modalTitle = document.getElementById('modal-title');
    const modalPriceStock = document.getElementById('modal-price-stock');
    const modalDetails = document.getElementById('modal-details');
    const modalDescription = document.getElementById('modal-description');
    const discountSection = document.getElementById('discount-section');
    const discountInfo = document.getElementById('discount-info');
    const discountTimer = document.getElementById('discount-timer');
    const prevSlideButton = document.getElementById('prev-slide');
    const nextSlideButton = document.getElementById('next-slide');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const closeModalButton = document.getElementById('close-page');
    const relatedProductsContainer = document.getElementById('related-products-container');

    let currentSlide = 0;
    let phoneNumber;
    let currentImages = [];
    let product;
    let discountLabel;
    let primaryColor = ''; // Default color
    let allProducts = []; // Variable para almacenar todos los productos

    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            const { products, phone, store } = data;
            phoneNumber = `${phone.prefix}${phone.number}`;
            primaryColor = store.color; // Get the color from JSON
            allProducts = products; // Guardar todos los productos en la variable

            const productId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
            product = allProducts.find(p => p.id === productId);

            if (product) {
                updateProductDetails();
                setupSlider();
                setupMessageInput();
                applyStyles();
                loadRelatedProducts(allProducts, product); // Pasar todos los productos y el producto actual
            } else {
                document.body.innerHTML = '<h1>Producto no encontrado</h1>';
            }
        })
        .catch(error => console.error('Error al cargar los productos:', error));

    function updateProductDetails() {
        modalTitle.textContent = product.title;
        modalPriceStock.textContent = `S/.${product.price} • ${product.stock === 1 ? 'Queda 1' : `Quedan ${product.stock}`}`;

        modalDetails.innerHTML = product.details.map(detail => `
            <div class="flex w-full mb-2">
                <div class="w-2/4 font-bold">${detail.label}:</div>
                <div class="w-2/4 text-gray-900 dark:text-gray-200">${detail.value}</div>
            </div>
        `).join('');
        modalDescription.textContent = product.description;

        if (product.oldPrice) {
            const oldPrice = parseFloat(product.oldPrice);
            const price = parseFloat(product.price);
            const offerPercent = ((oldPrice - price) / oldPrice * 100).toFixed(0);

            createOrUpdateDiscountLabel(offerPercent);

            if (product.offerEnd) {
                discountInfo.innerHTML = `- ${offerPercent}% •&nbsp;`;
                startDiscountTimer(product.offerEnd);
                discountSection.classList.remove('hidden');
            } else {
                discountSection.classList.add('hidden');
            }
        } else {
            discountSection.classList.add('hidden');
            if (discountLabel) {
                discountLabel.remove();
            }
        }
    }

    function createOrUpdateDiscountLabel(offerPercent) {
        if (!discountLabel) {
            discountLabel = document.createElement('div');
            discountLabel.id = 'discount-label';
            discountLabel.className = `absolute top-0 right-0 z-10 bg-${primaryColor}-800 text-white py-2 text-2xl font-bold transform px-20 translate-x-16 translate-y-6 rotate-45`;
            slider.appendChild(discountLabel);
        }
        discountLabel.textContent = `- ${offerPercent}%`;
        discountLabel.classList.remove('hidden');
    }

    function setupSlider() {
        sliderImages.innerHTML = product.images.map((image, index) => `
            <img src="multimedia/${image}" alt="${product.title} - Imagen ${index + 1}" class="w-auto h-auto rounded" style="display: ${index === 0 ? 'block' : 'none'}">
        `).join('');
        currentImages = product.images;
        currentSlide = 0;

        slider.style.backgroundImage = `url(multimedia/${currentImages[currentSlide]})`;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        if (currentImages.length > 1) {
            if (isMobile) {
                prevSlideButton.style.display = 'none';
                nextSlideButton.style.display = 'none';
                createSliderDots();
                document.getElementById('slider-dots').style.display = 'block';
            } else {
                prevSlideButton.style.display = 'block';
                nextSlideButton.style.display = 'block';
                createSliderDots();
                document.getElementById('slider-dots').style.display = 'none';
            }
            setupSwipe();
        } else {
            prevSlideButton.style.display = 'none';
            nextSlideButton.style.display = 'none';
            document.getElementById('slider-dots').style.display = 'none';
        }

        prevSlideButton.addEventListener('click', () => changeSlide(-1));
        nextSlideButton.addEventListener('click', () => changeSlide(1));
    }

    function createSliderDots() {
        const dotsContainer = document.getElementById('slider-dots');
        dotsContainer.innerHTML = currentImages.map((_, index) => `
            <button class="dot w-3 h-3 rounded-full bg-${primaryColor}-400" data-index="${index}"></button>
        `).join('');

        updateDots();

        dotsContainer.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', (event) => {
                const index = parseInt(event.target.getAttribute('data-index'), 10);
                changeSlide(index - currentSlide);
            });
        });
    }

    function updateDots() {
        const dots = document.querySelectorAll('#slider-dots .dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle(`bg-${primaryColor}-800`, index === currentSlide);
            dot.classList.toggle(`bg-${primaryColor}-500`, index !== currentSlide);
        });
    }

    function setupSwipe() {
        const hammer = new Hammer(slider);
        hammer.on('swipeleft', () => changeSlide(1));
        hammer.on('swiperight', () => changeSlide(-1));
    }

    function changeSlide(direction) {
        const images = sliderImages.querySelectorAll('img');
        if (images.length > 0) {
            images[currentSlide].style.display = 'none';
            currentSlide = (currentSlide + direction + images.length) % images.length;
            images[currentSlide].style.display = 'block';
            adjustBackgroundImage(currentImages[currentSlide]);
            updateDots();
        }
    }

    function adjustBackgroundImage(imageSrc) {
        slider.style.backgroundImage = `url(multimedia/${imageSrc})`;
    }

    function setupMessageInput() {
        const message = `Hola, quiero comprar el ${product.title} a S/.${product.price}`;
        messageInput.value = message;

        const phoneNumberForProduct = (product.addType === 1 && product.phone) 
            ? `${product.phone.prefix}${product.phone.number}`
            : phoneNumber;

        sendButton.addEventListener('click', () => {
            if (phoneNumberForProduct) {
                const encodedMessage = encodeURIComponent(messageInput.value);
                const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumberForProduct}&text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
            } else {
                console.error('Número de teléfono no disponible');
            }
        });
    }

    function startDiscountTimer(endTime) {
        function updateTimer() {
            const distance = new Date(endTime).getTime() - new Date().getTime();
            if (distance > 0) {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                discountTimer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else {
                discountTimer.textContent = '';
                discountSection.classList.add('hidden');
                modalPriceStock.textContent = `S/.${product.oldPrice}`;
                messageInput.value = `Hola, quiero comprar el ${product.title} a S/.${product.oldPrice}`;
                if (discountLabel) {
                    discountLabel.remove();
                }
            }
        }
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    function applyStyles() {
        if (!primaryColor) {
            primaryColor = 'teal';
        }
        document.querySelectorAll('#prev-slide, #next-slide, .bg-teal-900, #send-button').forEach(element => {
            element.classList.add(`bg-${primaryColor}-800`);
            element.classList.add(`hover:bg-${primaryColor}-900`);
        });
        document.querySelectorAll('#close-page, #modal-price-stock').forEach(element => {
            element.classList.add(`text-${primaryColor}-800`);
        });
        document.querySelectorAll('#modal-price-stock').forEach(element => {
            element.classList.add(`dark:text-${primaryColor}-600`);
        });
        document.querySelectorAll('#discount-section, #stickycont, #message-input').forEach(element => {
            element.classList.add(`border-${primaryColor}-800`);
        });
    }

    function loadRelatedProducts(products, currentProduct) {
        const relatedProductsContainer = document.getElementById('related-products');
        relatedProductsContainer.innerHTML = ''; // Limpiar contenedor

        // Filtrar productos relacionados basados en categoría y características similares
        const relatedProducts = products
            .filter(p => p.id !== currentProduct.id)
            .filter(p => p.category === currentProduct.category || hasSimilarFeatures(currentProduct, p));

        if (relatedProducts.length === 0) {
            relatedProductsContainer.innerHTML = '<p>No hay productos relacionados.</p>';
            return;
        }

        // Mezclar productos relacionados aleatoriamente
        const shuffledProducts = shuffleArray(relatedProducts);

        // Usar el color primario global
        shuffledProducts.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = `relative bg-background rounded-md shadow overflow-hidden`;

            // Crear etiqueta de descuento si corresponde
            const discountLabel = product.oldPrice && product.addType !== 2
                ? `<div class="discount-label absolute top-0 right-0 z-10 bg-${primaryColor}-800 text-white py-2 text-xs md:text-sm font-bold transform px-20 translate-x-14 translate-y-6 rotate-45">- ${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</div>`
                : '';

            // Configurar HTML del precio
            const priceHTML = product.addType === 2
                ? `<p class="font-semibold text-${primaryColor}-800 mb-4 dark:text-${primaryColor}-700">${product.type} • Hosted</p>`
                : (product.oldPrice
                    ? `<p class="font-semibold text-${primaryColor}-800 mb-4 dark:text-${primaryColor}-700">
                        S/.${product.price}
                        <span class="line-through text-gray-500">S/.${product.oldPrice}</span>
                        ${product.addType === 1 ? '• Hosted' : ''}
                    </p>`
                    : `<p class="font-semibold text-${primaryColor}-800 mb-4 dark:text-${primaryColor}-700">S/.${product.price} ${product.addType === 1 ? '• Hosted' : ''}</p>`);

            // Configurar texto del botón y el enlace
            const buttonText = product.addType === 2 ? 'Ir' : 'Ver más';
            const buttonLink = product.addType === 2 ? product.link : `product.html?id=${encodeURIComponent(product.id)}`;

            productElement.innerHTML = `
                ${discountLabel}
                <img data-id="${product.id}" src="multimedia/${product.images[0]}" alt="${product.title}" width="400" height="300" class="w-full h-48 object-cover cursor-pointer ${product.addType === 2 ? 'max-w-full max-h-full' : ''}" style="aspect-ratio: 400 / 300; object-fit: cover;">
                <div class="p-4">
                    <h3 class="text-lg font-bold mb-2 dark:text-white cursor-pointer" data-id="${product.id}">${product.title}</h3>
                    ${priceHTML}
                    <a href="${buttonLink}" target="${product.addType === 2 ? '_blank' : '_self'}" class="dark:bg-${primaryColor}-800 dark:text-white inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-${primaryColor}-800 text-white transition-colors hover:bg-${primaryColor}-900 h-10 px-4 py-2 w-full">${buttonText}</a>
                </div>
            `;

            // Manejar clic en la imagen y el título del producto
            if (product.addType !== 2) {
                productElement.querySelector('img').addEventListener('click', function () {
                    window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
                });

                productElement.querySelector('h3').addEventListener('click', function () {
                    window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
                });
            }

            relatedProductsContainer.appendChild(productElement);
        });
    }

    // Función para mezclar el array aleatoriamente
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function hasSimilarFeatures(currentProduct, otherProduct) {
        const featureThreshold = 2; // Número mínimo de características similares para considerar dos productos similares
        const currentFeatures = currentProduct.details.map(d => d.label + ':' + d.value);
        const otherFeatures = otherProduct.details.map(d => d.label + ':' + d.value);
        
        const similarFeatureCount = currentFeatures.filter(feature => otherFeatures.includes(feature)).length;
        return similarFeatureCount >= featureThreshold;
    }

    closeModalButton.addEventListener('click', () => history.back());
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            history.back();
        }
    });

    slider.addEventListener('mousemove', () => {
        slider.style.backgroundImage = `url(multimedia/${currentImages[currentSlide]})`;
    });
});