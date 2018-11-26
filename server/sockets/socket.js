const { io } = require('../server');
const { Usuario } = require('../classes/Usuario');
const { crearMensaje } = require('../utils/utils');
const users = new Usuario();

io.on('connection', (client) => {
    client.on('entrarChat', (data, callback) => {
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                message: 'El nombre/sala es necesario'
            });
        }
        client.join(data.sala);
        users.agregarPersona(client.id, data.nombre, data.sala);
        client.broadcast.to(data.sala).emit('listaPersona', users.getPersonaPorSala(data.sala));
        callback(users.getPersonaPorSala(data.sala));
    });

    client.on('crearMensaje', (data) => {
        let persona = users.getPersona(client.id);
        let message = crearMensaje(persona.nombre, data.message);
        client.broadcast.to(persona.sala).emit('crearMensaje', message);
    });

    client.on('disconnect', () => {
        let personaBorrada = users.borrarPersona(client.id);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador:', `${personaBorrada.nombre} abandonó el chat`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', users.getPersonaPorSala(personaBorrada.sala));
    });

    // Mensajes privados
    client.on('mensajePrivado', (data) => {
        let persona = users.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.message));
    });
});