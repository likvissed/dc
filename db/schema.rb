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

ActiveRecord::Schema.define(version: 2020_07_07_082503) do

  create_table "cluster_details", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "cluster_id"
    t.integer "server_id"
    t.integer "node_role_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "clusters", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_clusters_on_name"
  end

  create_table "contacts", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "tn"
    t.string "info"
    t.integer "dept"
    t.integer "department_head_id"
    t.string "work_num", limit: 10
    t.string "mobile_num", limit: 20
    t.boolean "manually", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["dept"], name: "index_contacts_on_dept"
    t.index ["info"], name: "index_contacts_on_info"
  end

  create_table "department_heads", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "tn"
    t.integer "dept"
    t.string "info"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["dept"], name: "index_department_heads_on_dept"
    t.index ["info"], name: "index_department_heads_on_info"
  end

  create_table "detail_types", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_detail_types_on_name"
  end

  create_table "node_roles", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "real_server_details", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "server_id"
    t.integer "server_part_id"
    t.integer "count"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["server_id"], name: "index_real_server_details_on_server_id"
    t.index ["server_part_id"], name: "index_real_server_details_on_server_part_id"
  end

  create_table "roles", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.string "resource_type"
    t.integer "resource_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["name"], name: "index_roles_on_name"
  end

  create_table "server_parts", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.string "part_num"
    t.text "comment"
    t.integer "detail_type_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_server_parts_on_name"
  end

  create_table "server_types", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_server_types_on_name"
  end

  create_table "servers", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "server_type_id"
    t.string "inventory_num"
    t.string "serial_num"
    t.string "loc_area", limit: 20
    t.string "loc_stand", limit: 20
    t.string "loc_place", limit: 20
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["inventory_num"], name: "index_servers_on_inventory_num"
  end

  create_table "service_dependencies", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "child_id"
    t.integer "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["child_id"], name: "index_service_dependencies_on_child_id"
    t.index ["parent_id"], name: "index_service_dependencies_on_parent_id"
  end

  create_table "service_hostings", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "service_id"
    t.integer "cluster_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cluster_id"], name: "index_service_hostings_on_cluster_id"
    t.index ["service_id"], name: "index_service_hostings_on_service_id"
  end

  create_table "service_networks", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "service_id"
    t.string "segment", limit: 50
    t.string "vlan", limit: 20
    t.string "dns_name"
    t.string "ip", limit: 15
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ip"], name: "index_service_networks_on_ip"
  end

  create_table "service_ports", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "service_network_id"
    t.text "local_tcp_ports"
    t.text "local_udp_ports"
    t.text "inet_tcp_ports"
    t.text "inet_udp_ports"
    t.string "host_class"
    t.text "tcp_ports_2"
    t.text "udp_ports_2"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "services", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "number", limit: 20
    t.integer "dept"
    t.string "name"
    t.boolean "formular_type", null: false
    t.text "descr"
    t.integer "priority"
    t.date "deadline"
    t.integer "time_work"
    t.integer "max_time_rec"
    t.integer "contact_1_id"
    t.integer "contact_2_id"
    t.text "environment"
    t.string "os"
    t.string "component_key"
    t.float "kernel_count"
    t.float "frequency"
    t.float "memory"
    t.float "disk_space"
    t.string "hdd_speed"
    t.float "network_speed"
    t.text "additional_require"
    t.text "backup_manual"
    t.text "recovery_manual"
    t.float "value_backup_data"
    t.integer "storage_time"
    t.string "store_copies"
    t.float "backup_volume"
    t.string "backup_window"
    t.integer "time_recovery"
    t.string "duplicate_ps"
    t.string "raid"
    t.string "bonding"
    t.string "other"
    t.string "resiliency"
    t.integer "time_after_failure"
    t.string "disaster_rec"
    t.integer "time_after_disaster"
    t.integer "antivirus"
    t.string "firewall"
    t.string "uac_app_selinux"
    t.string "szi"
    t.string "internet"
    t.string "type_mon"
    t.string "service_mon"
    t.string "hardware_mon"
    t.string "security_mon"
    t.text "additional_data"
    t.datetime "scan_updated_at"
    t.bigint "scan_file_size"
    t.string "scan_content_type"
    t.string "scan_file_name"
    t.datetime "act_updated_at"
    t.bigint "act_file_size"
    t.string "act_content_type"
    t.string "act_file_name"
    t.boolean "has_instr_rec", default: false
    t.datetime "instr_rec_updated_at"
    t.bigint "instr_rec_file_size"
    t.string "instr_rec_content_type"
    t.string "instr_rec_file_name"
    t.boolean "has_instr_off", default: false
    t.datetime "instr_off_updated_at"
    t.bigint "instr_off_file_size"
    t.string "instr_off_content_type"
    t.string "instr_off_file_name"
    t.boolean "exploitation"
    t.text "comment"
    t.string "name_monitoring"
    t.string "consumer_fio", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["dept"], name: "index_services_on_dept"
    t.index ["name"], name: "index_services_on_name"
  end

  create_table "storage_systems", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "service_id"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "template_server_details", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "server_type_id"
    t.integer "server_part_id"
    t.integer "count"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["server_part_id"], name: "index_template_server_details_on_server_part_id"
    t.index ["server_type_id"], name: "index_template_server_details_on_server_type_id"
  end

  create_table "users", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "tn"
    t.string "info", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["info"], name: "index_users_on_info"
  end

  create_table "users_roles", id: false, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "user_id"
    t.integer "role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id"
  end

end
