const db= require('../models');

module.exports = async (req, res, next) => {
    const cnpjSh = req.headers['cnpj-sh'];
    const tokenSh = req.headers['token-sh'];
    const cnpjCedente = req.headers['cnpj-cedente'];
    const tokenCedente = req.headers['token-cedente'];

    //validação dos headers
    if(!cnpjSh || !tokenSh || !cnpjCedente || !tokenCedente){
        return res.status(400).json({error: 'CNPJ e Token são obrigatórios'});
    }

    try {
        //validação da SoftwareHouse
        const softwareHouse = await db.SoftwareHouse.findOne({
            where: { cnpj: cnpjSh, token: tokenSh}
        });
        if(!softwareHouse){
            return res.status(401).json({error: 'Software House não autorizada'});
        }

        //validação do Cedente
        const cedente = await db.Cedente.findOne({
            where: { cnpj: cnpjCedente, token: tokenCedente,}
        });
        if(!cedente){
            return res.status(401).json({error: 'Cedente não autorizado'});
        }

        req.softwareHouse = softwareHouse;
        req.cedente = cedente;
        next();
    } catch (err){
        return res.status(500).json({error: 'Error interno no servidor'});
    }
}