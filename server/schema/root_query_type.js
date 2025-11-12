const mongoose = require("mongoose");
const graphql = require("graphql");
const { GraphQLObjectType, GraphQLList, GraphQLID, GraphQLNonNull } = graphql;
const SongType = require("./song_type");
const LyricType = require("./lyric_type");
const Lyric = mongoose.model("lyric");
const Song = mongoose.model("song");
const UserType = require("./user_type");
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: () => ({
    songs: {
      type: new GraphQLList(SongType),
      async resolve() {
        return await Song.find({}).exec();
      },
    },
    song: {
      type: SongType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      async resolve(parentValue, { id }) {
        return await Song.findById(id).exec();
      },
    },
    lyric: {
      type: LyricType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      async resolve(parentValue, { id }) {
        return await Lyric.findById(id).exec();
      },
    },
    user: {
      type: UserType,
      resolve(parentValue, args, context) {
        return context.req.user;
      },
    },
  }),
});

module.exports = RootQuery;
