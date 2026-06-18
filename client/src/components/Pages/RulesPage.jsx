//Visitor Page/ Rules Explanation
//Default page

import { useContext } from "react";
import userContext from "../../utility/contexts/UserContext.js";

function RulesPage(){
    const user = useContext(userContext);
    return <> This is the rules Page here the rules are explayned for the {user.username}. Show play button for logged in users else log in button.</>
}

export default RulesPage;