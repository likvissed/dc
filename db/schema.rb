# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160718022121) do

  create_table "cluster_details", force: :cascade do |t|
    t.integer  "cluster_id",   limit: 4
    t.integer  "server_id",    limit: 4
    t.integer  "node_role_id", limit: 4
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  create_table "clusters", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  add_index "clusters", ["name"], name: "index_clusters_on_name", using: :btree

  create_table "detail_types", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  add_index "detail_types", ["name"], name: "index_detail_types_on_name", using: :btree

  create_table "node_roles", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  create_table "real_server_details", force: :cascade do |t|
    t.integer  "server_id",      limit: 4
    t.integer  "server_part_id", limit: 4
    t.integer  "count",          limit: 4
    t.datetime "created_at",               null: false
    t.datetime "updated_at",               null: false
  end

  add_index "real_server_details", ["server_id"], name: "index_real_server_details_on_server_id", using: :btree
  add_index "real_server_details", ["server_part_id"], name: "index_real_server_details_on_server_part_id", using: :btree

  create_table "roles", force: :cascade do |t|
    t.string   "name",          limit: 255
    t.integer  "resource_id",   limit: 4
    t.string   "resource_type", limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "roles", ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id", using: :btree
  add_index "roles", ["name"], name: "index_roles_on_name", using: :btree

  create_table "server_parts", force: :cascade do |t|
    t.string   "name",           limit: 255
    t.string   "part_num",       limit: 255
    t.text     "comment",        limit: 65535
    t.integer  "detail_type_id", limit: 4
    t.datetime "created_at",                   null: false
    t.datetime "updated_at",                   null: false
  end

  add_index "server_parts", ["name"], name: "index_server_parts_on_name", using: :btree

  create_table "server_statuses", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  create_table "server_types", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  add_index "server_types", ["name"], name: "index_server_types_on_name", using: :btree

  create_table "servers", force: :cascade do |t|
    t.integer  "server_type_id",   limit: 4
    t.string   "inventory_num",    limit: 255
    t.string   "serial_num",       limit: 255
    t.string   "name",             limit: 255
    t.string   "location",         limit: 255
    t.integer  "server_status_id", limit: 4
    t.datetime "created_at",                   null: false
    t.datetime "updated_at",                   null: false
  end

  add_index "servers", ["name"], name: "index_servers_on_name", using: :btree

  create_table "template_server_details", force: :cascade do |t|
    t.integer  "server_type_id", limit: 4
    t.integer  "server_part_id", limit: 4
    t.integer  "count",          limit: 4
    t.datetime "created_at",               null: false
    t.datetime "updated_at",               null: false
  end

  add_index "template_server_details", ["server_part_id"], name: "index_template_server_details_on_server_part_id", using: :btree
  add_index "template_server_details", ["server_type_id"], name: "index_template_server_details_on_server_type_id", using: :btree

  create_table "users", force: :cascade do |t|
    t.string   "username",            limit: 255
    t.string   "encrypted_password",  limit: 255, default: "", null: false
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",       limit: 4,   default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip",  limit: 255
    t.string   "last_sign_in_ip",     limit: 255
    t.datetime "created_at",                                   null: false
    t.datetime "updated_at",                                   null: false
  end

  add_index "users", ["username"], name: "index_users_on_username", unique: true, using: :btree

  create_table "users_roles", id: false, force: :cascade do |t|
    t.integer "user_id", limit: 4
    t.integer "role_id", limit: 4
  end

  add_index "users_roles", ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id", using: :btree

end
