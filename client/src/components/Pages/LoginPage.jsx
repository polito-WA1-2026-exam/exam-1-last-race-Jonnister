import { useState } from "react";
import { FormGroup, Form, Button, Container } from "react-bootstrap";
import sendRequest from "../../utility/Api";
/**
 * Login Page (Shows Username, Password form, Login Button)
 */
function LoginPage(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /** Logs in the user, if password and username have been correctly entered. 
   * 
   * @param {*} username the user's username (string)
   * @param {*} password the user's username (string)
   */
  const LoginUser = (username, password) => {
    try{
    if (username.trim() === "" ||password.trim() === "") {
      throw new Error("Please Enter a username and password.");
    }
    sendRequest(
      "/sessions",
      "POST",
      "logging in user",
      {
        username: username,
        password: password,
      },
      "JSON",
    ).then((user) => {
      props.handleLogin(user.id, user.username, user.highscore);
    }).catch((err)=>{
      props.setCurrentToast({title:"Error", text:`${err.message}`, type:"danger"})
    })
  }
  catch(err){
      props.setCurrentToast({title:"Error", text:`${err.message}`, type:"danger"})
    }};

  return (
    <>
      <Form>
        <FormGroup>
          <Form.Label>Username</Form.Label>
          <Form.Control
            placeholder="Enter Username"
            value={username}
            onChange={(evt) => setUsername(evt.target.value)}
            type="text"
          />
        </FormGroup>
        <FormGroup>
          <Form.Label>Password</Form.Label>
          <Form.Control
            placeholder="Enter Password"
            value={password}
            onChange={(evt) => setPassword(evt.target.value)}
            type="password"
          />
        </FormGroup>
        <Button
          className="btn btn-default"
          style={{marginTop:"1vh"}}
          onClick={() => {
            LoginUser(username, password);
          }}
        >
          Submit
        </Button>
      </Form>
    </>
  );
}

export default LoginPage;
