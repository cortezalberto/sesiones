
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const universalModel = require("../models/universalModel");
const userModel = universalModel("users");

const userController = {
// Qué hace Register
    register: (req, res) => {
        const countries = ["Argentina", "Uruguay", "Paraguay", "Chile", "Bolivia", "Perú", "Brasil", "Ecuador", "Venezuela", "Colombia"];

        return res.render("./users/register", {
            countries
        });
    },

 // Qué hace  processRegister 
    processRegister: (req, res) => {

        const countries = ["Argentina", "Uruguay", "Paraguay", "Chile", "Bolivia", "Perú", "Brasil", "Ecuador", "Venezuela", "Colombia"];

        const { file } = req;
// Creo un array con posibles errores
        const errores = validationResult(req);
// Si hay errores
        if (!errores.isEmpty()) {
            // Pregunto si viene foto y la elimino
            if (file) {
                const filePath = path.join(__dirname, `../../public/images/users/${file.filename}`);
                fs.unlinkSync(filePath);
            }

            console.log(req.body);
            // Por seguridad elimino las password
            delete req.body.password;
            delete req.body.rePassword;

            console.log(req.body);
            // Regreso a la vista mostrando los errores
            return res.render("./users/register", {
                errors: errores.mapped(),
                oldData: req.body,
                countries
            })
        }

   // Si no hay errores, debo capturar el email y verificar que no se 
   // haya registrado previamente en la base de datos

        const existeEmail = userModel.findFirstByField("email", req.body.email);
// Si ya fue registrado, debo eliminar la foto y avisar en la vista el error

        if (existeEmail) {
            if (file) {
                const filePath = path.join(__dirname, `../../public/images/users/${file.filename}`);
                fs.unlinkSync(filePath);
            }

            const error = {
                email: {
                    msg: "Este email ya está registrado"
                }
            }

            return res.render("./users/register", {
                errors: error,
                oldData: req.body,
                countries
            })
        }
    
    // No hay errores, es el camino con éxito

        delete req.body.rePassword;
// Armo el objeto literal con los campos propagados del body.
// Encriptamos la passsword y verificamos que si no viene foto, ponemos una por default
        const newUsuario = {
            ...req.body,
            password: bcrypt.hashSync(req.body.password, 10),
            image: file ? file.filename : "default-user.png"
        };

        // newUsuario.categoria.trim();
        userModel.create(newUsuario);

        return res.redirect("/users/login");
    },

// qué hace Login
    login: (req, res) => {
        return res.render("./users/login");
    },


// qué hace processLogin
    processLogin: (req, res) => {
// Armo el array de errores
        const errores = validationResult(req)
    // Pregunto si hay errores
        if (!errores.isEmpty()) {
            return res.render("./users/login", {
                errors: errores.mapped(),
                oldData: req.body
            })
        }
     // Valido loa existncia del email en la base de datos
        const usuarioRegistrado = userModel.findFirstByField("email", req.body.email);
     // Pregunto si está registrado
        if (!usuarioRegistrado) {
            const error = {
                email: {
                    msg: "Este email no se encuentra en nuestra base de datos"
                }
            }
            return res.render("./users/login", {
                errors: error,
                oldData: req.body
            })
        }
       // Validamos ahora su contraseña, por eso hay que desencriptarla
        const passwordCoincide = bcrypt.compareSync(req.body.password, usuarioRegistrado.password);
       // Valido la contraseña válida
        if (!passwordCoincide) {
            const error = {
                password: {
                    msg: "Las credenciales son inválidas"
                }
            }
            return res.render("./users/login", {
                errors: error,
                oldData: req.body
            })
        }
// Por seguridad elimino las credenciales
        delete usuarioRegistrado.password;
   
    // Se establece una varible de sesión para ese usuario
        req.session.usuarioLogueado = usuarioRegistrado;
// rememberUser es el nombre que le dimos al chekBox en la vista
//  Si viene tildado, queremos hacer la cookie
        if (req.body.rememberUser) {
            res.cookie("userEmail", req.body.email, { maxAge: 60 * 1000 * 60 * 24 * 30 })
        }
        return res.redirect("/users/profile");
    },

    profile: (req, res) => {
        // return res.render('./users/profile', {
        // 	user: req.session.usuarioLogueado
        // });

        return res.render('./users/profile');
    },

    logout: (req, res) => {
        res.clearCookie('userEmail');
        req.session.destroy();
        // delete req.session.usuarioLogueado
        return res.redirect('/');
    }
}



module.exports = userController;
