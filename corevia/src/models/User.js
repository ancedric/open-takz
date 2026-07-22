class User {
    constructor({
      id = '',
      email = '',
      password = '',
      name = '',
      tasks = [],
    } = {}) {
      this.id = id;
      this.email = email;
      this.password = password;
      this.name = name;
      this.tasks = tasks;
    }
  
    toJson() {
      return {
        id: this.id,
        email: this.email,
        password: this.password,
        name: this.name,
        tasks: this.tasks,
      };
    }
  }
  
  export default User;