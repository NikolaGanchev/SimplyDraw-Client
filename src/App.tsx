import logo from './logo.svg';
import './App.css';
import './index.css'
import Navbar from './Navbar'
import Board from './Board'
import { useTranslation } from 'react-i18next';
import { i18n } from 'i18next';
import { Route, BrowserRouter as Router, Switch, useParams } from "react-router-dom";



function switchLanguageIfPossible(lang: string, i18n: i18n) {
  i18n.languages.some((language: string) => {
    if (language === lang) {
      i18n.changeLanguage(lang);
      return true;
    }
  })
}

function TranslationHelper() {
  const [t, i18n] = useTranslation();
  let { lang }: any = useParams();
  console.log(lang);
  switchLanguageIfPossible(lang, i18n);
  return (<div></div>)
}

function App() {
  return (
    <div>
      <Router>
        <Switch>
          <Route path="/:lang" children={<TranslationHelper />} />
        </Switch>
      </Router>
      <Navbar></Navbar>
      <Board ></Board>
    </div>
  );
}

export default App;