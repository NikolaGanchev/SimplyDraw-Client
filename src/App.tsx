import logo from './logo.svg';
import './App.css';
import './index.css'
import Navbar from './Navbar'
import Board from './Board'
import { useTranslation } from 'react-i18next';
import { i18n } from 'i18next';
import { Route, BrowserRouter as Router, Switch, useParams } from "react-router-dom";
import ResponsiveError from './ResponsiveError';
import { useEffect, useState } from 'react';
import EventBus, { EVENTS } from './Events/EventBus';



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
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState("");
  const [t] = useTranslation("common");

  EventBus.subscribe(EVENTS.ERROR, (error: Error) => {
    setError(error.message);
    setShowError(true);
  });

  useEffect(() => {
    document.title = t("app.name");
  }, []);

  return (
    <div>
      <Router>
        <Switch>
          <Route path="/:lang" children={<TranslationHelper />} />
        </Switch>
      </Router>
      {showError ?
        (<ResponsiveError error={error} onResponse={setShowError}></ResponsiveError>) :
        (null)}
      <Navbar></Navbar>
      <Board ></Board>
    </div>
  );
}

export default App;