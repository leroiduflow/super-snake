About The Project
Super Snake is a modern take on the classic arcade game Snake, built entirely with HTML, CSS, and JavaScript. This project aims to deliver a fun and engaging gameplay experience with added features like power-ups, dynamic obstacles, custom graphics, immersive sound effects, and a persistent high score system.

The game is designed to be responsive and playable directly in your web browser.

Features
Classic Snake Gameplay: Grow your snake by eating food, but avoid colliding with walls, yourself, or obstacles.
Dynamic Obstacles: Encounter both static and moving obstacles that add a new layer of challenge.
Power-Ups: Discover and collect various power-ups for temporary advantages:
Speed Boost: Increase your snake's speed for a limited time.
Score Multiplier: Earn more points for each food item eaten.
Shrink: Reduce your snake's length to navigate tight spots.
Invincibility: Become temporarily immune to obstacles and walls (be careful, snake-on-self collision still applies!).
Level Progression: Advance through levels as your score increases, introducing new challenges and faster gameplay.
Custom Graphics & Sound: Enjoy themed visuals and immersive sound effects for eating, collisions, power-ups, and background music.
Persistent High Scores: Your top scores are saved locally in your browser, so you can always aim to beat your best!
Intuitive Controls: Play using arrow keys (desktop) or an on-screen D-Pad (for mobile/touch devices).
Pause Functionality: Pause and resume the game at any time with a dedicated button or key.
Responsive Design: The game adapts its layout to various screen sizes for a consistent experience on desktops, tablets, and mobile phones.
How to Play
Start Game: Click the "Start Game" button on the main menu to begin your adventure.
Controls:
Desktop: Use the Arrow Keys (Up, Down, Left, Right) on your keyboard to change the snake's direction.
Mobile/Touch: Utilize the on-screen D-Pad buttons for intuitive control.
Objective: Guide your snake to eat the food (the apple) to grow longer and increase your score.
Avoid:
Colliding with the game boundaries (unless "wrap-around" mode is enabled in settings).
Colliding with your own snake body.
Colliding with any static or moving obstacles (unless you have collected an Invincibility power-up).
Power-Ups: Collect the glowing power-up items that appear periodically for temporary special abilities.
Getting Started
To run this project locally on your machine, follow these simple steps:

Clone the Repository: Open your terminal or command prompt and run the following command:
Bash

git clone https://github.com/leroiduflow/super-snake.git
Navigate to the Project Directory:
Bash

cd super-snake
Open in Browser:
Simply open the index.html (or snake.html if you haven't renamed it for GitHub Pages compatibility) file directly in your preferred web browser.
Alternatively, for a more robust local development environment, you can use a simple HTTP server (e.g., Python's built-in http.server). In your project directory, run:
Bash

python -m http.server 8000
Then, open your browser and go to http://localhost:8000.
Project Structure
.
├── assets/
│   ├── images/
│   │   ├── background.png
│   │   ├── food_apple.png
│   │   ├── obstacle.png
│   │   ├── powerup_invincibility.png
│   │   ├── powerup_multiplier.png
│   │   ├── powerup_shrink.png
│   │   ├── powerup_speed.png
│   │   ├── snake_body.png
│   │   ├── snake_head_down.png
│   │   ├── snake_head_left.png
│   │   ├── snake_head_right.png
│   │   └── snake_head_up.png
│   └── sounds/
│       ├── background_music.mp3
│       ├── eat.mp3
│       ├── game_over.mp3
│       ├── level_up.mp3
│       ├── powerup.mp3
│       └── wall_hit.mp3
├── index.html       <-- Or snake.html if not renamed for GitHub Pages
├── script.js
├── style.css
└── README.md
Live Demo
You can play Super Snake live on GitHub Pages here:
https://leroiduflow.github.io/super-snake/

Contributing
Contributions are always welcome! If you have suggestions for improvements, new features, or find any bugs, please feel free to:

Fork the repository.
Create a new branch (git checkout -b feature/your-feature-name).
Make your changes.
Commit your changes (git commit -m 'Add a new feature').
Push to the branch (git push origin feature/your-feature-name).
Open a Pull Request describing your changes.
License
This project is open source and available under the MIT License.

Enjoy the game!
