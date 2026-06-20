//Login Page (Shows Username, Password form, Login Button)
import { useState } from "react";
import { FormGroup, Form, Button, Container } from "react-bootstrap";
import sendRequest from "../../utility/Api";
function LoginPage(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
        {
          //TODO: Add some space here between button and form; Make prettier in general
        }
        <Button
          className="btn btn-default"
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
