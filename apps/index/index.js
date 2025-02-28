async function getAllmeals() {
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/search.php?f=";
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    let allmeals = [];

    for (let letter of alphabet) {
        try {
            const response = await fetch(baseUrl + letter);
            const data = await response.json();

            if (data.meals) {
                allmeals = allmeals.concat(data.meals);
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération des repas pour '${letter}':`, error);
        }
    }
    return allmeals;
}

async function getAllCategories() {
    const url = "https://www.themealdb.com/api/json/v1/1/categories.php";
    const httpRes = await fetch(url);
    const data = await httpRes.json();
    let allcategories = data.categories;
    return allcategories;
}
  
  async function getMealsByCategoryUrl(categoryUrl) {
    const httpRes = await fetch(categoryUrl);
    const data = await httpRes.json();
    let mealsOfACategory = data.meals;
    return mealsOfACategory;
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

    // Limiter à 50 meals maximum
    const limitedMeals = meals.slice(0, 50);
    for (let meal of limitedMeals) {
        displaymeal(meal);
    }
}

async function initialRender() {
    const meals = await getAllmeals();
    cleanAndDisplayMeals(meals);
}


async function buildCategorySelect() {
    const allcategories = await getAllCategories();
    const typeSelect = document.getElementById("type-select");
    for (const category of allcategories) {
        const optionEl = document.createElement("option");
        optionEl.textContent = category.strCategory[0].toUpperCase() + category.strCategory.substring(1);
        optionEl.value = category.strCategory;
        typeSelect.appendChild(optionEl);
    }

    typeSelect.addEventListener("change", async (event) => {
        const selectedCategory = event.target.value;
        //console.log("Catégorie sélectionnée :", selectedCategory);
        if (selectedCategory == "") {
            initialRender();
        } else {
            const url = "https://www.themealdb.com/api/json/v1/1/filter.php?c=" + event.target.value;
            const meals = await getMealsByCategoryUrl(url);
            cleanAndDisplayMeals(meals);
        }
    });
}

initialRender();
getAllCategories().then(console.log);
buildCategorySelect();
  