const universalModel = require("../models/universalModel");
const userModel = universalModel("users");

const usuarioLogueadoMiddleware = (req, res, next) => {

    res.locals.estaLogueado = false;
// Tomo el email del formulario
    const emailEnCookie = req.cookies.userEmail;
 // Busco el email si existe en la base de datos   
    const usuarioDeLaCookie = userModel.findFirstByField("email", emailEnCookie);

   // Si existe creo la variable de session 
    if(usuarioDeLaCookie){
        delete usuarioDeLaCookie.password;
        req.session.usuarioLogueado = usuarioDeLaCookie;
    }

    if(req.session.usuarioLogueado){
        res.locals.estaLogueado = true;
        res.locals.usuarioLogueado = req.session.usuarioLogueado;
    }

    next();

}

module.exports = usuarioLogueadoMiddleware