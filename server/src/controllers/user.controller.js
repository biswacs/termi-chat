import UserService from "../services/user.service.js";
const userService = new UserService();

const UserController = {
  async login(req, res) {
    const { email, username } = req.body;
    console.log(email, username);
    if ((!email, !username)) {
      console.log("email or username not found");
      return res.status(400).json({
        message: "email or username not found",
        data: { email: email, username: username },
      });
    }
    return res.status(200).json({
      message: "email or username found",
      data: { email: email, username: username },
    });
  },
};
export default UserController;
