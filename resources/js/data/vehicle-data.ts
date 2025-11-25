export interface VehicleModel {
    name: string;
}

export interface VehicleMake {
    name: string;
    models: VehicleModel[];
}

export interface VehicleType {
    value: string;
    label: string;
    makes: VehicleMake[];
}

export const vehicleData: VehicleType[] = [
    {
        value: 'car',
        label: 'Car',
        makes: [
            {
                name: 'Toyota',
                models: [
                    { name: 'Corolla' },
                    { name: 'Camry' },
                    { name: 'RAV4' },
                    { name: 'Highlander' },
                    { name: 'Prius' },
                    { name: 'Avalon' },
                    { name: 'Land Cruiser' },
                ],
            },
            {
                name: 'Honda',
                models: [
                    { name: 'Civic' },
                    { name: 'Accord' },
                    { name: 'CR-V' },
                    { name: 'Pilot' },
                    { name: 'Fit' },
                ],
            },
            {
                name: 'Nissan',
                models: [
                    { name: 'Altima' },
                    { name: 'Sentra' },
                    { name: 'Maxima' },
                    { name: 'Rogue' },
                    { name: 'Pathfinder' },
                ],
            },
            {
                name: 'Mercedes-Benz',
                models: [
                    { name: 'C-Class' },
                    { name: 'E-Class' },
                    { name: 'S-Class' },
                    { name: 'GLE' },
                    { name: 'GLC' },
                ],
            },
            {
                name: 'BMW',
                models: [
                    { name: '3 Series' },
                    { name: '5 Series' },
                    { name: '7 Series' },
                    { name: 'X3' },
                    { name: 'X5' },
                ],
            },
            {
                name: 'Ford',
                models: [
                    { name: 'Fusion' },
                    { name: 'Mustang' },
                    { name: 'Explorer' },
                    { name: 'Escape' },
                    { name: 'Edge' },
                ],
            },
            {
                name: 'Chevrolet',
                models: [
                    { name: 'Malibu' },
                    { name: 'Impala' },
                    { name: 'Equinox' },
                    { name: 'Traverse' },
                    { name: 'Tahoe' },
                ],
            },
            {
                name: 'Hyundai',
                models: [
                    { name: 'Elantra' },
                    { name: 'Sonata' },
                    { name: 'Tucson' },
                    { name: 'Santa Fe' },
                    { name: 'Palisade' },
                ],
            },
            {
                name: 'Volkswagen',
                models: [
                    { name: 'Jetta' },
                    { name: 'Passat' },
                    { name: 'Tiguan' },
                    { name: 'Atlas' },
                    { name: 'Golf' },
                ],
            },
            {
                name: 'Mazda',
                models: [
                    { name: 'Mazda3' },
                    { name: 'Mazda6' },
                    { name: 'CX-5' },
                    { name: 'CX-9' },
                    { name: 'MX-5 Miata' },
                ],
            },
        ],
    },
    {
        value: 'bus',
        label: 'Bus',
        makes: [
            {
                name: 'Mercedes-Benz',
                models: [
                    { name: 'Sprinter' },
                    { name: 'Tourismo' },
                    { name: 'Citaro' },
                    { name: 'Travego' },
                ],
            },
            {
                name: 'Volvo',
                models: [
                    { name: '9700' },
                    { name: '9900' },
                    { name: 'B8R' },
                    { name: 'B11R' },
                ],
            },
            {
                name: 'Scania',
                models: [
                    { name: 'Touring' },
                    { name: 'Interlink' },
                    { name: 'Citywide' },
                ],
            },
            {
                name: 'MAN',
                models: [
                    { name: 'Lion\'s Coach' },
                    { name: 'Lion\'s City' },
                    { name: 'Lion\'s Intercity' },
                ],
            },
            {
                name: 'Isuzu',
                models: [
                    { name: 'Journey' },
                    { name: 'Novo' },
                    { name: 'N-Series' },
                ],
            },
        ],
    },
    {
        value: 'truck',
        label: 'Truck',
        makes: [
            {
                name: 'Volvo',
                models: [
                    { name: 'FH' },
                    { name: 'FM' },
                    { name: 'FMX' },
                    { name: 'VNL' },
                ],
            },
            {
                name: 'Mercedes-Benz',
                models: [
                    { name: 'Actros' },
                    { name: 'Arocs' },
                    { name: 'Atego' },
                    { name: 'Axor' },
                ],
            },
            {
                name: 'Scania',
                models: [
                    { name: 'R-Series' },
                    { name: 'S-Series' },
                    { name: 'P-Series' },
                    { name: 'G-Series' },
                ],
            },
            {
                name: 'MAN',
                models: [
                    { name: 'TGX' },
                    { name: 'TGS' },
                    { name: 'TGM' },
                ],
            },
            {
                name: 'DAF',
                models: [
                    { name: 'XF' },
                    { name: 'CF' },
                    { name: 'LF' },
                ],
            },
            {
                name: 'Isuzu',
                models: [
                    { name: 'F-Series' },
                    { name: 'N-Series' },
                    { name: 'Giga' },
                ],
            },
            {
                name: 'Freightliner',
                models: [
                    { name: 'Cascadia' },
                    { name: 'M2' },
                    { name: 'Coronado' },
                ],
            },
        ],
    },
    {
        value: 'motorcycle',
        label: 'Motorcycle',
        makes: [
            {
                name: 'Honda',
                models: [
                    { name: 'CBR' },
                    { name: 'CB' },
                    { name: 'CRF' },
                    { name: 'Gold Wing' },
                    { name: 'Africa Twin' },
                ],
            },
            {
                name: 'Yamaha',
                models: [
                    { name: 'YZF-R' },
                    { name: 'MT' },
                    { name: 'Tenere' },
                    { name: 'XSR' },
                ],
            },
            {
                name: 'Suzuki',
                models: [
                    { name: 'GSX-R' },
                    { name: 'V-Strom' },
                    { name: 'Hayabusa' },
                    { name: 'Katana' },
                ],
            },
            {
                name: 'Kawasaki',
                models: [
                    { name: 'Ninja' },
                    { name: 'Z' },
                    { name: 'Versys' },
                    { name: 'Vulcan' },
                ],
            },
            {
                name: 'Harley-Davidson',
                models: [
                    { name: 'Street' },
                    { name: 'Sportster' },
                    { name: 'Softail' },
                    { name: 'Touring' },
                ],
            },
            {
                name: 'BMW',
                models: [
                    { name: 'R-Series' },
                    { name: 'S-Series' },
                    { name: 'F-Series' },
                    { name: 'G-Series' },
                ],
            },
        ],
    },
    {
        value: 'emergency',
        label: 'Emergency Vehicle',
        makes: [
            {
                name: 'Ford',
                models: [
                    { name: 'F-150 (Ambulance)' },
                    { name: 'Transit (Ambulance)' },
                    { name: 'Explorer (Police)' },
                    { name: 'F-550 (Fire)' },
                ],
            },
            {
                name: 'Chevrolet',
                models: [
                    { name: 'Silverado (Ambulance)' },
                    { name: 'Tahoe (Police)' },
                    { name: 'Express (Ambulance)' },
                ],
            },
            {
                name: 'Mercedes-Benz',
                models: [
                    { name: 'Sprinter (Ambulance)' },
                    { name: 'Vito (Ambulance)' },
                ],
            },
            {
                name: 'Dodge',
                models: [
                    { name: 'Charger (Police)' },
                    { name: 'Durango (Police)' },
                ],
            },
        ],
    },
    {
        value: 'government',
        label: 'Government Vehicle',
        makes: [
            {
                name: 'Toyota',
                models: [
                    { name: 'Land Cruiser' },
                    { name: 'Hilux' },
                    { name: 'Camry' },
                ],
            },
            {
                name: 'Ford',
                models: [
                    { name: 'Explorer' },
                    { name: 'F-150' },
                    { name: 'Transit' },
                ],
            },
            {
                name: 'Chevrolet',
                models: [
                    { name: 'Suburban' },
                    { name: 'Tahoe' },
                    { name: 'Silverado' },
                ],
            },
            {
                name: 'Mercedes-Benz',
                models: [
                    { name: 'S-Class' },
                    { name: 'E-Class' },
                    { name: 'Sprinter' },
                ],
            },
        ],
    },
];

export const getVehicleTypeOptions = () => {
    return vehicleData.map((type) => ({
        value: type.value,
        label: type.label,
    }));
};

export const getMakesByType = (vehicleType: string) => {
    const type = vehicleData.find((t) => t.value === vehicleType);
    return type ? type.makes.map((make) => make.name) : [];
};

export const getModelsByMake = (vehicleType: string, makeName: string) => {
    const type = vehicleData.find((t) => t.value === vehicleType);
    if (!type) return [];

    const make = type.makes.find((m) => m.name === makeName);
    return make ? make.models.map((model) => model.name) : [];
};
