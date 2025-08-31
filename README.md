# Quiz Bot
Quiz Bot is a Discord bot designed to track scores during weekly quizzes. It provides an efficient way to store and manage quiz results using a database, ensuring fair and accurate scorekeeping among participants.

## Features
- **Score Tracking:** Automatically records and updates quiz scores based on message reactions.
- **Database Storage:** Uses MongoDB Atlas to store quiz data securely.
- **Participant Tracking:** Keeps a record of all players who participate in the quizzes.
- **Winner Announcement:** Identifies and announces the winner at the end of each quiz.
- **Host Selection:** Allows for the designation of a quiz host to manage the session.

## Technologies Used
Quiz Bot leverages modern tools and frameworks to streamline development and ensure maintainability:
- **Discord.js:** A powerful JavaScript library for interacting with the Discord API.
- **Mongoose:** An elegant MongoDB object modeling tool for Node.js.
- **MongoDB Atlas:** A cloud-hosted MongoDB database for seamless data management.
- **Discobase:** A utility package that simplifies database interactions for Discord bots.
Additionally, ChatGPT was used solely to assist in writing this README, ensuring clarity and professionalism.

## Installation & Setup (Coming Soon)
Currently, there are no setup instructions available. However, future updates will include a step-by-step guide to running the bot locally and deploying it to the cloud.

## Hosting & Deployment
During development, the bot is currently running locally, while the database is hosted remotely on MongoDB Atlas. This setup allows for efficient local testing while ensuring persistent and secure storage of quiz data in the cloud.

## Future Plans
As development progresses, several key improvements are planned for Quiz Bot:
- **Cloud Deployment:** Transition from local hosting to a cloud-based service for 24/7 availability.
- **Web-Based Leaderboard:** Develop a web interface displaying quiz scores with customizable themes.
These enhancements will improve functionality, accessibility, and user experience for the server quiz sessions.

## Contributions & Feedback
At this stage, the project is private and primarily for the CGD server. However, contributions and feedback are always welcome for future improvements.

## License
This project does not have an open-source license at this time.


# Quiz Bot Commands

This section explains all commands and options for the Quiz Bot.

---

## `/player add`

**Description:** Add a player to the database.

**Options:**

| Option | Type   | Description                      | Required |
| ------ | ------ | -------------------------------- | -------- |
| `user` | User   | The user to add                  | Yes      |
| `name` | String | The real-life name of the player | No       |

**Notes:**

* Assigns the `quizplayer` role to the user.
* Initializes the player's points to 0.
* Optional `name` field can personalize the user.

---

## `/player remove`

**Description:** Remove a player from the database.

**Options:**

| Option | Type | Description        | Required |
| ------ | ---- | ------------------ | -------- |
| `user` | User | The user to remove | Yes      |

**Notes:**

* Removes the `quizplayer` role from the user.
* Deletes the user's database entry.

---

## `/player update`

**Description:** Update player information in the database.

**Options:**

| Option | Type   | Description                          | Required |
| ------ | ------ | ------------------------------------ | -------- |
| `user` | User   | The user to update                   | Yes      |
| `name` | String | The new real-life name of the player | No       |

**Notes:**

* Leaving `name` blank sets it to null.
* Updates the user's database record and optionally their IRL name.

---

## `/player points`

**Description:** Display the current points of a player.

**Options:**

| Option | Type | Description                    | Required |
| ------ | ---- | ------------------------------ | -------- |
| `user` | User | The user to display points for | Yes      |

**Notes:**

* Fetches the total points from the database.
* Includes the real-life name if set, otherwise uses the username.

---

## `/quiz start`

**Description:** Start a new quiz.

**Options:**

| Option | Type | Description                    | Required |
| ------ | ---- | ------------------------------ | -------- |
| `host` | User | Who is hosting the quiz today? | Yes      |

**Notes:**

* Only one quiz can be active at a time.
* Assigns the `quizhost` role to the host user.
* Initializes points for all players in the current quiz as 0.

---

## `/quiz end`

**Description:** End today's quiz and show results.

**Options:**

| Option | Type | Description                    | Required |
| ------ | ---- | ------------------------------ | -------- |
| `host` | User | Who is hosting the quiz today? | Yes      |

**Notes:**

* Requires `quizhost` role to run.
* Displays quiz results with a scoreboard.
* Awards points to top 5 players.
* Clears the current quiz data and removes `quizhost` roles.

---

## `/quiz give`

**Description:** Give points to a player.

**Options:**

| Option   | Type   | Description                  | Required |
| -------- | ------ | ---------------------------- | -------- |
| `player` | User   | The player to give points to | Yes      |
| `points` | Number | Number of points to add      | Yes      |

**Notes:** Requires `quizhost` role.

---

## `/quiz take`

**Description:** Take points from a player.

**Options:**

| Option   | Type   | Description                    | Required |
| -------- | ------ | ------------------------------ | -------- |
| `player` | User   | The player to take points from | Yes      |
| `points` | Number | Number of points to remove     | Yes      |

**Notes:** Requires `quizhost` role.

---

## `/quiz wipe`

**Description:** Wipe the entire leaderboard and all quiz data.

**Options:** None

**Notes:**

* Requires confirmation via buttons.
* Deletes all players, current quiz, and quiz overview data.
* Only users with `quizhost` role can initiate.

---

## `/quiz clear`

**Description:** Clear points for the active quiz.

**Options:** None

**Notes:**

* Requires `quizhost` role.
* Resets all player points in the current quiz to zero.

---

## `/quiz timer`

**Description:** Set a timer for players.

**Options:**

| Option         | Type            | Description                                                | Required |
| -------------- | --------------- | ---------------------------------------------------------- | -------- |
| `time`         | Integer         | Timer duration in milliseconds (predefined choices)        | Yes      |
| `return`       | Channel (Voice) | Voice channel to return participants after timer           | No       |
| `forceanswers` | Integer         | Force players to submit answers within this time (seconds) | No       |

**Notes:**

* Mentions all players with the `quizplayer` role when time is up.
* Returns players to a specific voice channel if provided.
* Supports nested answer timers.

**Timer Choices:**

* 5 seconds → 5000
* 30 seconds → 30000
* 1 minute → 60000
* 1 minute 30 seconds → 90000
* 2 minutes → 120000
* 2 minutes 30 seconds → 150000
* 3 minutes → 180000
* 5 minutes → 300000
* 10 minutes → 600000
* 15 minutes → 900000
* 20 minutes → 1200000

---

## `/quiz teams`

**Description:** Generate teams or delete existing team channels.

**Options:**

| Option  | Type    | Description                | Required |
| ------- | ------- | -------------------------- | -------- |
| `total` | Integer | Number of teams to create  | No       |
| `size`  | Integer | Number of members per team | No       |
| `end`   | Boolean | Remove all team channels   | No       |

**Notes:**

* Either `total` or `size` must be specified to generate teams.
* Requires players to have the `quizplayer` role and be connected to voice channels.
* Teams are automatically assigned to new voice channels within the user's category.

---

## `/quiz scoreboard`

**Description:** Show the current scores for the active quiz.

**Options:** None

**Notes:**

* Displays scores for all players in the current quiz.
* Sorted by points descending.

---

## `/quiz leaderboard`

**Description:** Show the leaderboard for all quizzes.

**Options:** None

**Notes:**

* Displays total points for all players across all quizzes.
* Top 3 players are displayed with medals (🥇🥈🥉).

---

### Roles Required

* **quizhost** – Required for commands that modify quiz state or points (`start`, `end`, `give`, `take`, `wipe`, `clear`, `timer`).
* **quizplayer** – Players participating in the quiz. Used in timer pings and team generation.

---

### Example 

```txt
/player add user:@Alice name:Alice Johnson
/player update user:@Alice name:Alicia Johnson
/player points user:@Alice
/player remove user:@Alice
/quiz start host:@Alice
/quiz give player:@Bob points:5
/quiz timer time:60000 forceanswers:30
/quiz teams total:3
/quiz end host:@Alice
```

