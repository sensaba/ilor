const mongoose = require('mongoose')
require('mongoose-double')(mongoose);

let SchemaTypes = mongoose.Schema.Types;
const sociologySchema = new mongoose.Schema(
{
    developer: String,
    propertyName: String,
    country: String,
    state: String,
    city: String,
    longitude: {type: SchemaTypes.Double, default: 0.0},
    latitude: {type: SchemaTypes.Double, default: 0.0},
    busStop: [{name: String, distance: SchemaTypes.Double}],
    railwayStation: [{name: String, distance: SchemaTypes.Double}],
    healthCare: [{name: String, distance: SchemaTypes.Double}],
    shopping: [{name: String, distance: SchemaTypes.Double}],
    foodCenter: [{name: String, distance: SchemaTypes.Double}],
    childNeeds: [{name: String, distance: SchemaTypes.Double}],
    activeFlag: {type: Boolean, default: true}
});
        
const SociologyData = mongoose.model('SociologyData', sociologySchema);
