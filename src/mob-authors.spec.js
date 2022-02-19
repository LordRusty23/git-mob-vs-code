const { workspace } = require("../__mocks__/vscode");
const commands = require("./git/commands");
const { MobAuthors } = require("./mob-authors");
const { Author } = require("./co-author-tree-provider/author");
const { getAllAuthors, setCoAuthors } = require("./git/git-mob-api");
const { CoAuthor } = require("./co-author-tree-provider/co-authors");

jest.mock("./git/commands");
jest.mock("./git/git-mob-api");

describe("Co-author list", function () {
  const mobAuthors = new MobAuthors();
  const author = new Author("Richard Kotze", "rkotze@email.com");

  beforeAll(function () {
    workspace.getConfiguration.mockReturnValue({
      get() {
        return "ascending";
      },
    });
    jest.spyOn(mobAuthors, "author", "get").mockImplementation(() => author);
  });

  beforeEach(function () {
    getAllAuthors.mockReset();
    mobAuthors.reset();
  });

  it("Repo authors should not contain co-authors with same email", async function () {
    getAllAuthors.mockReturnValueOnce([
      { key: "rk", name: "Richard Kotze", email: "rkotze@email.com" },
      { key: "ts", name: "Tony Stark", email: "tony@stark.com" },
    ]);

    commands.getRepoAuthors.mockResolvedValueOnce(
      `   33\tRichard Kotze <rkotze@email.com>\n   53\tCaptian America <captain@america.com>`
    );

    let repoAuthors = await mobAuthors.repoAuthorList();

    expect(repoAuthors).toHaveLength(1);
    expect(repoAuthors[0].email).toEqual("captain@america.com");
  });

  it("Remove author from repo authors", async function () {
    getAllAuthors.mockReturnValueOnce([
      { key: "ts", name: "Tony Stark", email: "tony@stark.com" },
    ]);
    commands.getRepoAuthors.mockResolvedValueOnce(
      `   33\tRichard Kotze <rkotze@email.com>\n   53\tBlack Panther <black@panther.com>`
    );

    const repoAuthors = await mobAuthors.repoAuthorList();
    const repoAuthorEmails = repoAuthors.map((author) => author.email);

    expect(repoAuthorEmails).not.toEqual(
      expect.arrayContaining([author.email])
    );
  });

  it("Set selected co-authors only", async function () {
    getAllAuthors.mockReturnValueOnce([
      {
        key: "rk",
        name: "Richard Kotze",
        email: "rkotze@email.com",
        selected: false,
      },
      {
        key: "ts",
        name: "Tony Stark",
        email: "tony@stark.com",
        selected: true,
      },
      {
        key: "pp",
        name: "Peter Parker",
        email: "peter@stark.com",
        selected: false,
      },
    ]);

    const selected = [
      new CoAuthor("Peter Parker", "peter@stark.com", false, "pp"),
    ];
    await mobAuthors.set(selected);
    const all = await mobAuthors.listAll();
    const pp = all.find((author) => author.commandKey == "pp");
    const ts = all.find((author) => author.commandKey == "ts");
    expect(pp.selected).toEqual(true);
    expect(ts.selected).toEqual(false);
    expect(setCoAuthors).toBeCalledWith(["pp"]);
  });
});
