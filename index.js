document.addEventListener('DOMContentLoaded', function () {
    let selectedCategory = 'all'; // Variable para almacenar la categoría seleccionada
    let menuOpen = false; // Estado del menú
    let storeColor = 'teal'; // Color de la tienda por defecto

    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            const categories = new Set();
            const productsContainer = document.getElementById('product-list');
            const categoryList = document.getElementById('category-list');
            const searchBar = document.getElementById('search-bar');
            const categoryMenu = document.getElementById('category-menu');
            const store = data.store; // Cambiado a 'store'

            storeColor = store.color || 'teal'; // Obtener el color de la tienda desde el JSON

            // Actualizar header y footer
            document.getElementById('header-logo').src = `multimedia/${store.logo}`; // Actualizado
            document.getElementById('header-store-name').textContent = store.storeName; // Actualizado
            document.getElementById('header-slogan').textContent = store.slogan; // Actualizado
            document.getElementById('footer-logo').src = `multimedia/${store.logo}`; // Actualizado
            document.getElementById('footer-store-name').textContent = store.storeName; // Actualizado
            document.getElementById('footer-slogan').textContent = store.slogan; // Actualizado

            // Actualizar colores de la página
            const updatePageColors = (color) => {
                const elements = {
                    header: document.getElementById('header'),
                    categoryMenu: document.getElementById('category-menu'),
                    footer: document.getElementById('footer'),
                    discountLabels: document.querySelectorAll('.discount-label')
                };

                elements.header.className = `fixed transition z-50 top-0 w-full bg-${color}-900 py-4 duration-300`;
                elements.categoryMenu.className = `fixed dark:text-white text-${color}-900 top-0 right-0 w-full md:w-1/5 bg-${color}-50 dark:bg-${color}-800 transition-transform duration-300 ease-in-out ${elements.categoryMenu.classList.contains('hidden') ? 'hidden' : ''} h-screen z-50 p-3`;
                elements.footer.className = `flex bg-${color}-900 py-8 text-white`; // Añadir color al footer
                
                elements.discountLabels.forEach(label => {
                    label.className = label.className.replace(/bg-\w+-\d+/g, `bg-${color}-800`);
                });
            };

            updatePageColors(storeColor); // Aplicar color de la tienda

            // Función para comprobar si la oferta ha expirado
            const isOfferExpired = (offerEndDate) => {
                const now = new Date();
                return new Date(offerEndDate) <= now;
            };

            // Función para actualizar productos
            const updateProductOffers = (products) => {
                products.forEach(product => {
                    if (product.offerEnd && isOfferExpired(product.offerEnd)) {
                        product.price = product.oldPrice; // Cambiar el precio al oldPrice
                        product.oldPrice = null; // Eliminar el oldPrice
                    }
                });
            };

            // Función para insertar productos
            const insertProducts = (category, searchQuery = '') => {
                productsContainer.innerHTML = ''; // Limpiar productos

                updateProductOffers(data.products); // Actualizar ofertas antes de insertar productos

                // Filtrar los productos por categoría, búsqueda y addType
                let filteredProducts = data.products.filter(product => {
                    const matchesCategory = category === 'all' || product.category.toLowerCase() === category;
                    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch && product.addType !== 2; // Excluir addType 2
                });

                // Ordenar los productos según la prioridad definida
                filteredProducts.sort((a, b) => {
                    const getPriority = product => {
                        const isAd = product.addType === 1;
                        const hasDiscount = product.oldPrice && product.price < product.oldPrice;
                        const discountRate = hasDiscount ? (product.oldPrice - product.price) / product.oldPrice : 0;
                        const timeUntilEnd = new Date(product.offerEnd) - new Date();
                        const timeSinceStart = new Date() - new Date(product.addStart);

                        if (isAd) {
                            if (hasDiscount && timeUntilEnd > 0) {
                                return discountRate < 0.5 ? 1 : 2;
                            } else if (!hasDiscount && timeUntilEnd > 0) {
                                return 5;
                            } else if (hasDiscount && timeUntilEnd <= 0) {
                                return discountRate < 0.5 ? 6 : 7;
                            } else {
                                return 10;
                            }
                        } else {
                            if (hasDiscount && timeUntilEnd > 0) {
                                return discountRate < 0.5 ? 3 : 4;
                            } else if (!hasDiscount && timeUntilEnd > 0) {
                                return 7;
                            } else if (hasDiscount && timeUntilEnd <= 0) {
                                return discountRate < 0.5 ? 8 : 9;
                            } else if (hasDiscount && !product.offerEnd) {
                                return discountRate < 0.5 ? 11 : 12;
                            } else {
                                return 13;
                            }
                        }
                    };

                    return getPriority(a) - getPriority(b);
                });

                // Mezclar productos manteniendo la lógica de prioridad
                for (let i = 0; i < filteredProducts.length; i++) {
                    const shouldShuffle = Math.random() > 0.5; // 50% de probabilidad de mezclar
                    if (shouldShuffle) {
                        const randomIndex = Math.floor(Math.random() * (filteredProducts.length - i)) + i;
                        [filteredProducts[i], filteredProducts[randomIndex]] = [filteredProducts[randomIndex], filteredProducts[i]];
                    }
                }

                // Insertar productos en el contenedor
                filteredProducts.forEach(product => {
                    const productElement = document.createElement('div');
                    productElement.className = `relative bg-background rounded-md shadow overflow-hidden`;

                    // Lógica de muestra del producto y manejo de eventos
                    const discountLabel = product.oldPrice
                        ? `<div class="discount-label absolute top-0 right-0 z-10 bg-${storeColor}-800 text-white py-2 text-xs md:text-sm font-bold transform px-20 translate-x-14 translate-y-6 rotate-45">- ${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</div>`
                        : '';

                    const priceHTML = product.oldPrice
                        ? `<p class="font-semibold text-${storeColor}-800 mb-4 dark:text-${storeColor}-700">
                            S/.${product.price}
                            <span class="line-through text-gray-500">S/.${product.oldPrice}</span>
                            ${product.addType === 1 ? '• Hosted' : ''}
                        </p>`
                        : `<p class="font-semibold text-${storeColor}-800 mb-4 dark:text-${storeColor}-700">S/.${product.price} ${product.addType === 1 ? '• Hosted' : ''}</p>`;

                    const buttonText = 'Ver más';
                    const buttonLink = `product.html?id=${encodeURIComponent(product.id)}`;

                    productElement.innerHTML = `
                        ${discountLabel}
                        <img data-id="${product.id}" src="multimedia/${product.images[0]}" alt="${product.title}" width="400" height="300" class="w-full h-48 object-cover cursor-pointer" style="aspect-ratio: 400 / 300; object-fit: cover;">
                        <div class="p-4">
                            <h3 class="text-lg font-bold mb-2 dark:text-white cursor-pointer" data-id="${product.id}">${product.title}</h3>
                            ${priceHTML}
                            <a href="${buttonLink}" target="_self" class="dark:bg-${storeColor}-800 dark:text-white inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-${storeColor}-800 text-white transition-colors hover:bg-${storeColor}-900 h-10 px-4 py-2 w-full">${buttonText}</a>
                        </div>
                    `;

                    // Manejar clic en la imagen y el título del producto
                    productElement.querySelector('img').addEventListener('click', function () {
                        window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
                    });

                    productElement.querySelector('h3').addEventListener('click', function () {
                        window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
                    });

                    productsContainer.appendChild(productElement);
                });
            };

            // Insertar categorías
            categories.add('all'); // Añadir opción de ver todo
            data.products.forEach(product => {
                categories.add(product.category.toLowerCase());
            });

            categories.forEach(category => {
                const pluralCategory = category === 'all' ? 'Todo' : `${category}s`; // Agregar 's' al final
                const categoryElement = document.createElement('li');
                categoryElement.innerHTML = `<button class="capitalize category-item ${category === 'all' ? `font-bold text-${storeColor}-900 dark:text-${storeColor}-50` : ''}" data-category="${category}">${pluralCategory}</button>`;
                categoryList.appendChild(categoryElement);
            });

            // Manejar clic en categoría
            categoryList.addEventListener('click', function (event) {
                if (event.target.classList.contains('category-item')) {
                    selectedCategory = event.target.getAttribute('data-category'); // Obtener la categoría desde el atributo data

                    // Eliminar font-bold de todos los elementos de categoría
                    document.querySelectorAll('#category-list .category-item').forEach(item => item.classList.remove('font-bold', `text-${storeColor}-900`, 'dark:text-white'));
                    
                    // Agregar font-bold al elemento seleccionado
                    event.target.classList.add('font-bold', `text-${storeColor}-900`, 'dark:text-white');
                    
                    // Insertar productos para la categoría seleccionada
                    insertProducts(selectedCategory, searchBar.value);
                    
                    // Cerrar el menú en dispositivos móviles
                    if (window.innerWidth < 768) { // Ajusta el valor según el breakpoint de Tailwind CSS
                        document.getElementById('category-menu').classList.add('hidden');
                        menuOpen = false;
                    }
                }
            });
            
            // Manejar búsqueda de productos
            searchBar.addEventListener('input', function () {
                insertProducts(selectedCategory, searchBar.value);
            });

            // Insertar productos inicialmente
            insertProducts(selectedCategory);
        });

    // Manejar clic en el botón de menú
    document.getElementById('menu-icon').addEventListener('click', function () {
        const categoryMenu = document.getElementById('category-menu');
        menuOpen = !menuOpen;
        
        if (menuOpen) {
            categoryMenu.classList.remove('hidden');
        } else {
            categoryMenu.classList.add('hidden');
        }
    });

    // Manejar clic en el botón de cerrar dentro del menú de categorías
    document.getElementById('category-menu-close').addEventListener('click', function () {
        const categoryMenu = document.getElementById('category-menu');
        categoryMenu.classList.add('hidden');
        menuOpen = false;
    });

    // Variables para rastrear la posición del scroll
    let prevScrollPos = window.pageYOffset;

    window.onscroll = function() {
        // Obtener la posición actual del scroll
        let currentScrollPos = window.pageYOffset;
        
        // Comparar la posición actual con la posición anterior
        if (prevScrollPos > currentScrollPos) {
            // Si se está desplazando hacia arriba, mostrar el header
            document.getElementById("header").style.transform = "translateY(0)";
        } else {
            // Si se está desplazando hacia abajo, ocultar el header
            document.getElementById("header").style.transform = "translateY(-100%)";
        }
        
        // Actualizar la posición anterior del scroll
        prevScrollPos = currentScrollPos;
    }
});
