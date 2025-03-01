let allMeals = [];
let currentIndex = 0;
const batchSize = 50;
let isFiltered = false;

// Fetch all meals from the API (alphabetically)
async function getAllmeals() {
    if (allMeals.length > 0) return allMeals;
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/search.php?f=";
    const alphabet = "abcdefghijklmnopqrstuvwxyz";

    const requests = alphabet.split('').map(letter => fetch(baseUrl + letter).then(res => res.json()));
    const results = await Promise.all(requests);

    allMeals = results.flatMap(data => data.meals || []);
    return allMeals;
}

// Load meals dynamically in batches when scrolling
async function loadMoreMeals() {
    if (isFiltered || currentIndex >= allMeals.length) return;
    const mealsBatch = allMeals.slice(currentIndex, currentIndex + batchSize);
    mealsBatch.forEach(displayMeal);
    currentIndex += batchSize;
}

// Fetch filter options (category, area, ingredient)
async function fetchFilterData(type) {
    const urlMap = {
        'category': "https://www.themealdb.com/api/json/v1/1/list.php?c=list",
        'area': "https://www.themealdb.com/api/json/v1/1/list.php?a=list",
        'ingredient': "https://www.themealdb.com/api/json/v1/1/list.php?i=list"
    };
    if (!urlMap[type]) return [];
    const response = await fetch(urlMap[type]);
    const data = await response.json();
    return data.meals;
}

// Populate filter dropdown based on selected type
async function updateFilterOptions() {
    const type = document.getElementById("filter-type").value;
    const filterOptions = document.getElementById("filter-options");
    filterOptions.innerHTML = "<option value=''>Select an option</option>";

    if (type) {
        const items = await fetchFilterData(type);
        items.forEach(item => {
            const option = document.createElement("option");
            let valueKey = (type === "ingredient") ? "strIngredient" : "str" + type.charAt(0).toUpperCase() + type.slice(1);
            option.value = item[valueKey];
            option.textContent = item[valueKey];
            filterOptions.appendChild(option);
        });
    } else {
        return initialRender();
    }
}

// Fetch meals based on selected filter option
async function filterMeals() {
    const type = document.getElementById("filter-type").value;
    const value = document.getElementById("filter-options").value;
    if (!type || !value) return initialRender();
    
    isFiltered = true;
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?${type.charAt(0)}=${value}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.meals) return cleanAndDisplayMeals([]);

    const mealDetailsPromises = data.meals.map(meal => 
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal['idMeal']}`)
            .then(res => res.json())
            .then(data_meal => data_meal.meals ? data_meal.meals[0] : null)
    );
    
    let meals = await Promise.all(mealDetailsPromises);
    meals = meals.filter(meal => meal !== null);
    cleanAndDisplayMeals(meals);
}

// Display meal details in a popup
function showMealDetails(meal) {
    const overlay = document.getElementById("popup-overlay");
    const details = document.getElementById("meal-popup");

    details.innerHTML = "";

    const closeButton = document.createElement('button');
    closeButton.textContent = "×";
    closeButton.className = "close-btn";
    closeButton.onclick = closePopup;
    details.appendChild(closeButton);

    const mealName = document.createElement('span');
    mealName.textContent = meal["strMeal"];
    mealName.className = "meal-name";
    details.appendChild(mealName);

    if (meal['strYoutube']) {
        const videoTitle = document.createElement('span');
        videoTitle.textContent = "Video";
        videoTitle.className = "meal-video-title";
        details.appendChild(videoTitle);

        const videoYTB = document.createElement('iframe');
        videoYTB.className = "meal-video";
        videoYTB.width = "560";
        videoYTB.height = "315";
        videoYTB.src = meal['strYoutube'].replace("watch?v=", "embed/");
        videoYTB.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        videoYTB.allowFullscreen = true;
        details.appendChild(videoYTB);
    }
    
    overlay.classList.remove("hidden");
    overlay.style.display = "flex";
}

// Close meal details popup
function closePopup() {
    const overlay = document.getElementById("popup-overlay");
    overlay.classList.add("hidden");
    overlay.style.display = "none";
    document.getElementById("meal-popup").innerHTML = "";
}

// Display a meal card
function displayMeal(mealData) {
    const meals = document.getElementById('meals');
    const meal = document.createElement('div');
    meal.className = 'meal';
    meal.onclick = function(){ showMealDetails(mealData); };

    const mealName = document.createElement('span');
    mealName.textContent = mealData["strMeal"];
    mealName.className = "meal-name";
    meal.appendChild(mealName);

    const imageMeal = document.createElement('img');
    imageMeal.src = mealData["strMealThumb"];
    imageMeal.className = "meal-img";
    meal.appendChild(imageMeal);

    meals.appendChild(meal);
}

// Clear all displayed meals
async function cleanMeals() {
    document.getElementById("meals").innerHTML = "";
}

// Clear and display a new set of meals
async function cleanAndDisplayMeals(meals) {
    await cleanMeals();
    meals.forEach(displayMeal);
}

// Initial meal loading
async function initialRender() {
    await cleanMeals();
    currentIndex = 0;
    isFiltered = false;
    await getAllmeals();
    loadMoreMeals();
}

// Observe scroll to load more meals dynamically
const observer = new IntersectionObserver(entries => {
    if (!isFiltered && entries[0].isIntersecting) {
        loadMoreMeals();
    }
}, { rootMargin: "100px" });

observer.observe(document.getElementById("scroll-spy"));

// Display a random meal popup
async function displayRandomMeal() {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    const data = await response.json();
    showMealDetails(data.meals[0]);
}

// Search meals by name
function searchMeals() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    getAllmeals().then(meals => {
        const filteredMeals = meals.filter(meal => meal.strMeal.toLowerCase().includes(query));
        isFiltered = true;
        cleanAndDisplayMeals(filteredMeals);
    });
}

initialRender();
