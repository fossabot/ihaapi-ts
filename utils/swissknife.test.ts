import * as SwissKnife from './swissknife';

// filter_empty()
describe("Filter out empty data from Array", () => {
    test("No data passed.", () => {
        expect(SwissKnife.filter_empty([])).toEqual([]);
    });
    test("Undefined data and null", () => {
        expect(SwissKnife.filter_empty(null)).toEqual([]);
    })
    test("One data passed.", () => {
        expect(SwissKnife.filter_empty(["one"])).toEqual(["one"]);
    });
    test("Multiple data passed (with no empty data).", () => {
        expect(SwissKnife.filter_empty(["one", "two", "three"])).toStrictEqual(["one", "two", "three"]);
    });
    test("Multiple data passed (with one empty data).", () => {
        expect(SwissKnife.filter_empty(["one", "two", "", "three"])).toStrictEqual(["one", "two", "three"]);
    });
});

// hasKey()
describe("Check if Object have a certain key.", () => {
    test("Undefined data passed.", () => {
        expect(SwissKnife.hasKey(null, "id")).toBeFalsy();
        expect(SwissKnife.hasKey(undefined, "id")).toBeFalsy();
    });
    test("Empty data passed.", () => {
        expect(SwissKnife.hasKey({}, "id")).toBeFalsy();
    });
    test("Data passed. --> {data: 'test'} get `id`", () => {
        expect(SwissKnife.hasKey({data: "test"}, "id")).toBeFalsy();
    });
    test("Data passed. --> {data: 'test', id: 123} get `id`", () => {
        expect(SwissKnife.hasKey({data: "test", id: 123}, "id")).toBeTruthy();
    });
});

// getValueFromKey()
describe("Get value from Object by a certain key.", () => {
    test("Undefined data passed.", () => {
        expect(SwissKnife.getValueFromKey(null, "id")).toStrictEqual(null);
        expect(SwissKnife.getValueFromKey(undefined, "id")).toStrictEqual(null);
    });
    test("Undefined data passed with fallback.", () => {
        expect(SwissKnife.getValueFromKey(null, "id", 123456)).toStrictEqual(123456);
        expect(SwissKnife.getValueFromKey(undefined, "id", 123456)).toStrictEqual(123456);
    });
    test("Empty data passed.", () => {
        expect(SwissKnife.getValueFromKey({}, "id")).toStrictEqual(null);
    });
    test("Empty data passed with fallback.", () => {
        expect(SwissKnife.getValueFromKey({}, "id", 123456)).toStrictEqual(123456);
    });
    test("Data passed. --> {data: 'test'} get `id`", () => {
        expect(SwissKnife.getValueFromKey({data: "test"}, "id")).toStrictEqual(null);
    });
    test("Data passed. --> {data: 'test'} get `id` with fallback", () => {
        expect(SwissKnife.getValueFromKey({data: "test"}, "id", 123456)).toStrictEqual(123456);
    });
    test("Data passed. --> {data: 'test', id: 123} get `id`", () => {
        expect(SwissKnife.getValueFromKey({data: "test", id: 123}, "id")).toStrictEqual(123);
    });
});

// is_none()
describe("Is data passed undefined or nulltype", () => {
    it("Passed normal data type (Should be `false`) ", () => {
        expect(SwissKnife.is_none(["data", "y"])).toStrictEqual(false);
        expect(SwissKnife.is_none({data: "y"})).toStrictEqual(false);
        expect(SwissKnife.is_none(true)).toStrictEqual(false);
        expect(SwissKnife.is_none(false)).toStrictEqual(false);
        expect(SwissKnife.is_none("test")).toStrictEqual(false);
        expect(SwissKnife.is_none(123)).toStrictEqual(false);
    });
    it("Passed a Null-type data (Should be `true`) ", () => {
        expect(SwissKnife.is_none(undefined)).toStrictEqual(true);
        expect(SwissKnife.is_none(null)).toStrictEqual(true);
    });
})


// Map boolean.
describe("Map a string to a boolean", () => {
    it("Passed a null data. (Should be `false`)", () => {
        expect(SwissKnife.map_bool(null)).toStrictEqual(false);
    });
    it("Passed a undefined data. (Should be `false`)", () => {
        expect(SwissKnife.map_bool(undefined)).toStrictEqual(false);
    });
    it("Passed a string that is 'n' (Should be `false`)", () => {
        expect(SwissKnife.map_bool("n")).toStrictEqual(false);
        expect(SwissKnife.map_bool("N")).toStrictEqual(false);
        expect(SwissKnife.map_bool("no")).toStrictEqual(false);
        expect(SwissKnife.map_bool("NO")).toStrictEqual(false);
        expect(SwissKnife.map_bool("disable")).toStrictEqual(false);
        expect(SwissKnife.map_bool("false")).toStrictEqual(false);
        expect(SwissKnife.map_bool("0")).toStrictEqual(false);
        expect(SwissKnife.map_bool(0)).toStrictEqual(false);
    });
    it("Passed a string that is 'y' (Should be `true`)", () => {
        expect(SwissKnife.map_bool("y")).toStrictEqual(true);
        expect(SwissKnife.map_bool("Y")).toStrictEqual(true);
        expect(SwissKnife.map_bool("yes")).toStrictEqual(true);
        expect(SwissKnife.map_bool("YES")).toStrictEqual(true);
        expect(SwissKnife.map_bool("enable")).toStrictEqual(true);
        expect(SwissKnife.map_bool("true")).toStrictEqual(true);
        expect(SwissKnife.map_bool("1")).toStrictEqual(true);
        expect(SwissKnife.map_bool(1)).toStrictEqual(true);
    });
});

// Object[] sort
describe("Sort an Array of Object by using a key on Object", () => {
    it("Passed undefined data.", () => {
        expect(SwissKnife.sortObjectsByKey(undefined, "id")).toEqual([]);
    });
    it("Passed empty data.", () => {
        expect(SwissKnife.sortObjectsByKey([], "id")).toEqual([]);
    });
    it("Passed non-array.", () => {
        expect(SwissKnife.sortObjectsByKey({id: "55555"}, "id")).toEqual({id: "55555"});
    });
    it("Passed Array of Object, but the length is only one.", () => {
        expect(SwissKnife.sortObjectsByKey([{id: "555555"}], "data")).toEqual([{id: "555555"}]);
    });
    it("Passed Array of Object, but key is missing from Object.", () => {
        expect(SwissKnife.sortObjectsByKey([{id: "555555"}, {"id": "44444"}], "data")).toEqual([{id: "555555"}, {"id": "44444"}]);
    });
    it("Passed Array of Object, and key exist on Object.", () => {
        expect(SwissKnife.sortObjectsByKey([{id: "555555"}, {"id": "44444"}], "id")).toEqual([{id: "44444"}, {"id": "555555"}]);
    });
});

// capitalizeIt()
describe("Capitalize first letter", () => {
    it("Passed a null data", () => {
        expect(SwissKnife.capitalizeIt(null)).toStrictEqual(null);
    });
    it("Passed string `test string`, expecting `Test string`", () => {
        expect(SwissKnife.capitalizeIt("test string")).toStrictEqual("Test string");
    });
});
