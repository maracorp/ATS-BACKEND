const graphql = require("graphql");
const { GraphQLObjectType, GraphQLString, GraphQLID } = graphql;
const mongoose = require("mongoose");
const Song = mongoose.model("song");
const Lyric = mongoose.model("lyric");
const SongType = require("./song_type");
const LyricType = require("./lyric_type");
const UserType = require("./user_type");
const AuthService = require("../services/auth");

const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    // Add a new user
    signup: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve(parentValue, { email, password }, context) {
        return AuthService.signup({ email, password, context });
      },
    },
    login: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve(parentValue, { email, password }, context) {
        return AuthService.login({ email, password, context });
      },
    },

    logout: {
      type: UserType,
      args: {},
      resolve(parentValue, args, context) {
        const { user } = context.req;
        const { req } = context;
        console.log("Logging out user:", user);
        //req.logout();
        //return user;
        req.logout((err) => {
          if (err) {
            throw new Error("Logout failed");
          }
          return user;
        });
      },
    },
    addSong: {
      type: SongType,
      args: {
        title: { type: GraphQLString },
      },
      resolve(parentValue, { title }) {
        return new Song({ title }).save();
      },
    },
    addLyricToSong: {
      type: SongType,
      args: {
        content: { type: GraphQLString },
        songId: { type: GraphQLID },
      },
      resolve(parentValue, { content, songId }) {
        return Song.addLyric(songId, content);
      },
    },
    likeLyric: {
      type: LyricType,
      args: { id: { type: GraphQLID } },
      resolve(parentValue, { id }) {
        return Lyric.like(id);
      },
    },
    deleteSong: {
      type: SongType,
      args: { id: { type: GraphQLID } },
      resolve(parentValue, { id }) {
        return Song.findByIdAndRemove(id);
      },
    },
  },
});

module.exports = mutation;
