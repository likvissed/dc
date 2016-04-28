class CreateRealServerDetails < ActiveRecord::Migration
  def change
    create_table :real_server_details do |t|
      t.references  :server, index: true
      t.references  :server_part, index: true
      t.integer     :count
      t.timestamps null: false
    end
  end
end
