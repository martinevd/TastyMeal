let allMeals = [];
let currentIndex = 0;
const batchSize = 50;
let isFiltered = false;


async function getAllmeals() {
    //Si déjà exécuté, pas besoin de le réexécuter
    if (allMeals.length > 0){
        return allMeals;
    }
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/search.php?f=";
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    let meals = [];

    for (let letter of alphabet) {
        try {
            const response = await fetch(baseUrl + letter);
            const data = await response.json();
            if (data.meals) {
                meals = meals.concat(data.meals);
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération des repas pour '${letter}':`, error);
        }
    }
    allMeals = meals;
    return meals;
}

async function loadMoreMeals() {
    
    if (isFiltered ||currentIndex >= allMeals.length){ 
        return;
    }
    const mealsBatch = allMeals.slice(currentIndex, currentIndex + batchSize);
    mealsBatch.forEach(displaymeal);
    currentIndex += batchSize;
}

async function fetchFilterData(type) {
    let url;
    switch (type) {
        case 'category':
            url = "https://www.themealdb.com/api/json/v1/1/list.php?c=list";
            break;
        case 'area':
            url = "https://www.themealdb.com/api/json/v1/1/list.php?a=list";
            break;
        case 'ingredient':
            url = "https://www.themealdb.com/api/json/v1/1/list.php?i=list";
            break;
        default:
            return [];
    }
    const response = await fetch(url);
    const data = await response.json();
    return data.meals;
}

async function updateFilterOptions() {
    const type = document.getElementById("filter-type").value;
    const filterOptions = document.getElementById("filter-options");
    filterOptions.innerHTML = "<option value=''>Select an option</option>";

    if (type) {
        const items = await fetchFilterData(type);
        items.forEach(item => {
            const option = document.createElement("option");

            // Sélectionne la bonne clé selon le type
            let valueKey = "str" + type.charAt(0).toUpperCase() + type.slice(1);
            if (type === "ingredient") valueKey = "strIngredient";

            option.value = item[valueKey];
            option.textContent = item[valueKey];

            filterOptions.appendChild(option);
        });
    }else{
        return initialRender();
    }
}

async function filterMeals() {
    const type = document.getElementById("filter-type").value;
    const value = document.getElementById("filter-options").value;
    if (!type || !value){ 
        return initialRender();
    }

    
    let url = `https://www.themealdb.com/api/json/v1/1/filter.php?${type.charAt(0)}=${value}`;
    console.log(url);
    const response = await fetch(url);
    const data = await response.json();

    isFiltered = true

    if (!data.meals) {
        cleanAndDisplayMeals([]);
        return;
    }

    const mealDetailsPromises = data.meals.map(async meal => {
        const response_meal = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal['idMeal']}`);
        const data_meal = await response_meal.json();
        return data_meal.meals ? data_meal.meals[0] : null;
    });

    let meals = await Promise.all(mealDetailsPromises);
    meals = meals.filter(meal => meal !== null);

    cleanAndDisplayMeals(meals);

}


  

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

    if (meal['strYoutube'] != "") {

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
    
    const category = document.createElement('span');
    category.innerHTML = "<strong>Category:</strong> " + meal['strCategory'];
    category.className = "meal-category";
    details.appendChild(category);

    const area = document.createElement('span');
    area.innerHTML = "<strong>Area:</strong> " + meal['strArea'];
    area.className = "meal-area";
    details.appendChild(area);

    const ingredientsTitle = document.createElement('span');
    ingredientsTitle.textContent = "Ingrédients";
    ingredientsTitle.className = "meal-ingredients-title";
    details.appendChild(ingredientsTitle);     
    for (let i = 1; i <= 20 && meal['strIngredient' + i] != null && meal['strIngredient' + i] != ""; i++) {   
        const ingredient_i = document.createElement('span');
        ingredient_i.textContent = meal['strMeasure' + i] + " - " + meal['strIngredient' + i];
        ingredient_i.className = "meal-ingredient";
        details.appendChild(ingredient_i);
    }

    const instructionsTitle = document.createElement('span');
    instructionsTitle.textContent = "Instructions";
    instructionsTitle.className = "meal-instructions-title";
    details.appendChild(instructionsTitle);

    const instructions = document.createElement('span');
    instructions.textContent = meal['strInstructions'];
    instructions.className = "meal-instructions";
    details.appendChild(instructions);
    
    overlay.classList.remove("hidden");
    overlay.style.display = "flex";
}

function closePopup() {
    const overlay = document.getElementById("popup-overlay");
    overlay.classList.add("hidden");
    overlay.style.display = "none";
}

function displaymeal(mealData) {
    const meals = document.getElementById('meals');

    const meal = document.createElement('div');
    meal.className = 'meal';
    meal.onclick = function(){
        showMealDetails(mealData);
    }

    const mealName = document.createElement('span');
    mealName.textContent = mealData["strMeal"];
    mealName.className = "meal-name";

    const imageMeal = document.createElement('img');
    imageMeal.src = mealData["strMealThumb"];
    imageMeal.className = "meal-img";

    meal.appendChild(mealName);
    meal.appendChild(imageMeal);
    meals.appendChild(meal);
}

async function cleanMeals(){
    const wrapper = document.getElementById("meals");
    while (wrapper.firstChild) {
        wrapper.removeChild(wrapper.firstChild);
    }
}

async function cleanAndDisplayMeals(meals) {
    await cleanMeals();
    meals.forEach(meal => displaymeal(meal));
}

async function initialRender() {
    cleanMeals()
    currentIndex = 0;
    isFiltered = false;
    await getAllmeals();
    loadMoreMeals();
}

const observer = new IntersectionObserver(entries => {
    if (!isFiltered && entries[0].isIntersecting) {
        loadMoreMeals();
    }
}, { rootMargin: "100px" });

observer.observe(document.getElementById("scroll-spy"));

async function displayRandomMeal() {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    const data = await response.json();
    console.log(data.meals[0])
    showMealDetails(data.meals[0]);
}

function searchMeals() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const mealsContainer = document.getElementById("meals");
    mealsContainer.innerHTML = "";

    getAllmeals().then(meals => {
        const filteredMeals = meals.filter(meal => meal.strMeal.toLowerCase().includes(query));
        filteredMeals.forEach(displaymeal);
    });
}

initialRender();
  