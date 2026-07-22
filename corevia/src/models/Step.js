class Step {
    constructor({
      id = '',
      name = '',
      time = '',
      done = false,
    } = {}) {
      this.id = id;
      this.name = name;
      this.time = time;
      this.done = done;
    }
  
    toJson() {
      return {
        id: this.id,
        name: this.name,
        time: this.time,
        done: this.done,
      };
    }
  }
  
  export default Step;