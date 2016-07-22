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

ActiveRecord::Schema.define(version: 20160726094703) do

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

  create_table "contacts", force: :cascade do |t|
    t.integer  "tn",         limit: 4
    t.string   "info",       limit: 255
    t.string   "dept",       limit: 20
    t.string   "work_num",   limit: 10
    t.string   "mobile_num", limit: 20
    t.boolean  "manually",               default: false
    t.datetime "created_at",                             null: false
    t.datetime "updated_at",                             null: false
  end

  add_index "contacts", ["dept"], name: "index_contacts_on_dept", using: :btree

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

  create_table "services", force: :cascade do |t|
    t.string   "id_form",             limit: 20
    t.string   "dept",                limit: 10
    t.string   "name",                limit: 255
    t.text     "descr",               limit: 65535
    t.integer  "priority",            limit: 4
    t.integer  "time_work",           limit: 4
    t.string   "max_time_rec",        limit: 255
    t.integer  "contact_1_id",        limit: 4
    t.integer  "contact_2_id",        limit: 4
    t.text     "environment",         limit: 65535
    t.string   "os",                  limit: 255
    t.string   "component_key",       limit: 255
    t.string   "kernel_count",        limit: 255
    t.string   "frequency",           limit: 255
    t.string   "memory",              limit: 255
    t.string   "disk_space",          limit: 255
    t.string   "hdd_speed",           limit: 255
    t.string   "network_speed",       limit: 255
    t.text     "additional_require",  limit: 65535
    t.text     "backup_manual",       limit: 65535
    t.text     "recovery_manual",     limit: 65535
    t.string   "value_backup_data",   limit: 255
    t.string   "storage_time",        limit: 255
    t.string   "store_copies",        limit: 255
    t.string   "backup_volume",       limit: 255
    t.string   "backup_window",       limit: 255
    t.string   "time_recovery",       limit: 255
    t.string   "duplicate_ps",        limit: 255
    t.string   "raid",                limit: 255
    t.string   "bonding",             limit: 255
    t.string   "other",               limit: 255
    t.string   "resiliency",          limit: 255
    t.string   "time_after_failure",  limit: 255
    t.string   "disaster_rec",        limit: 255
    t.string   "time_after_disaster", limit: 255
    t.string   "antivirus",           limit: 255
    t.string   "firewall",            limit: 255
    t.string   "uac_app_selinux",     limit: 255
    t.string   "szi",                 limit: 255
    t.string   "internet",            limit: 255
    t.text     "tcp_ports",           limit: 65535
    t.text     "udp_ports",           limit: 65535
    t.text     "inet_tcp",            limit: 65535
    t.text     "inet_udp",            limit: 65535
    t.string   "type_mon",            limit: 255
    t.string   "service_mon",         limit: 255
    t.string   "hardware_mon",        limit: 255
    t.string   "security_mon",        limit: 255
    t.text     "additional_data",     limit: 65535
    t.boolean  "has_instr_rec"
    t.boolean  "has_instr_off"
    t.boolean  "exploitation"
    t.text     "comment",             limit: 65535
    t.string   "name_monitoring",     limit: 255
    t.datetime "created_at",                        null: false
    t.datetime "updated_at",                        null: false
  end

  add_index "services", ["dept"], name: "index_services_on_dept", using: :btree
  add_index "services", ["name"], name: "index_services_on_name", using: :btree

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
