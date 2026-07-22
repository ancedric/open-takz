class Task {
    constructor({
      id = '',
      title = '',
      description = '',
      steps = [],
      progression = 0,
      completed = false,
      date = Date.now(),
      userId = '',
    } = {}) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.steps = steps;
      this.progression = progression;
      this.completed = completed;
      this.date = date;
      this.userId = userId;
    }
  
    toJson() {
      return {
        id: this.id,
        title: this.title,
        description: this.description,
        steps: this.steps,
        progression: this.progression,
        completed: this.completed,
        date: this.date,
        userId: this.userId,
      };
    }
  }
  
  export default Task;