const mongoose = require('mongoose')
require('mongoose-double')(mongoose);

let SchemaTypes = mongoose.Schema.Types;
const soilSchema = new mongoose.Schema(
    {
        developer: String,
        propertyName: String,
        country: String,
        state: String,
        city: String,
        longitude: {type: SchemaTypes.Double, default: 0.0},
        latitude: {type: SchemaTypes.Double, default: 0.0},
        soilDesc: String,
        soilIcon: String,
        activeFlag: {type: Boolean, default: true}
    });
        
    const SoilData = mongoose.model('SoilDetails', soilSchema);
