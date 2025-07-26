import User from "../model/user.schema.js";

class UserService {
  async findUserWithEmail(email) {
    try {
      const findUser = await User.findOne({
        where: { email: email.toLowerCase(), isActive: true },
      });
      if (!findUser) {
        return {
          success: false,
          message: "User doesn't exists",
        };
      }
      return {
        success: true,
        message: "User already exists",
        data: findUser,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }
  async createUserWithEmailAndUsername(email, username) {
    try {
      const createUser = await User.create({
        email: email.toLowerCase(),
        username: username,
      });
      return {
        success: true,
        message: "User created successfully",
        data: createUser,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }
}

export default UserService;
