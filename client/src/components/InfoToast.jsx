import { useEffect, useState } from "react";
import { ToastContainer, Toast } from "react-bootstrap";

function InfoToast(props) {
  const [currentToasts, setCurrentToasts] = useState([]);

  useEffect(() => {
    if (props.toast !== undefined) setCurrentToasts([...currentToasts, props.toast]);
  }, [props.toast]);
  return (
    <ToastContainer position="bottom-center">
      {currentToasts.map((toast,i) => {
        return <ToastPreset key={i} title={toast.title} text={toast.text} type={toast.type} currentToasts={currentToasts} setCurrentToasts={setCurrentToasts}/>
})}
    </ToastContainer>
  );
}

export default InfoToast;

export function ToastPreset(props) {
  const [title, setTitle] = useState(props.title);
  const [text, setText] = useState(props.text);
  const [type, setType] = useState(props.type ? props.type : ""); //Warning/Danger
  const [show, setShow] = useState(true);
  return (
    <Toast
      bg={type}
      onClose={() => {
        setShow(false);
        props.setCurrentToasts(props.currentToasts.filter((toast) => toast.text === text))
      }}
      show={show}
      autohide
      delay={3000}
    >
      <Toast.Header>
        <strong className="me-auto">{title}</strong>
      </Toast.Header>
      <Toast.Body>{text}</Toast.Body>
    </Toast>
  );
}
